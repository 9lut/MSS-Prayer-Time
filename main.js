function populateYearOptions() {
    const yearSelect = document.getElementById("year");
    yearSelect.innerHTML = "";
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    const endYear = currentYear + 1;

    for (let y = startYear; y <= endYear; y++) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }
}

// แปลงวันเป็นภาษาไทยและย่อ
function translateAndAbbreviateDay(day) {
    switch (day) {
        case "Monday": return "จ";
        case "Tuesday": return "อ";
        case "Wednesday": return "พ";
        case "Thursday": return "พฤ";
        case "Friday": return "ศ";
        case "Saturday": return "ส";
        case "Sunday": return "อา";
        default: return day;
    }
}

// ดึงเวลาละหมาดและวันที่ฮิจริจาก API Aladhan (method=3 = MWL)
async function getPrayerTimesForMonth(year, month) {
    const response = await fetch(
        `https://api.aladhan.com/v1/calendarByAddress/${year}/${month}?address=Songkhla, Thailand&method=3`
    );
    const data = await response.json();

    const prayerTimes = data.data.map((item) => {
        const day = item.date.gregorian.weekday.en;
        const dayTh = translateAndAbbreviateDay(day);
        const formattedDate = item.date.gregorian.day;
        const hijriDate = item.date.hijri.date;
        const hijriMonthEn = item.date.hijri.month.en;
        const hijriYear = item.date.hijri.year;
        const formattedHijriDate = `${hijriDate.split("-")[0]}-${hijriMonthEn}-${hijriYear}`;

        return {
            day: dayTh,
            date: formattedDate,
            datearabe: formattedHijriDate,
            fajr: item.timings.Fajr.replace(" (+07)", ""),
            sun: item.timings.Sunrise.replace(" (+07)", ""),
            dhuhr: item.timings.Dhuhr.replace(" (+07)", ""),
            asr: item.timings.Asr.replace(" (+07)", ""),
            maghrib: item.timings.Maghrib.replace(" (+07)", ""),
            isha: item.timings.Isha.replace(" (+07)", ""),
        };
    });

    return prayerTimes;
}

// อัพเดตตารางเวลาละหมาด
async function updateTable() {
    const yearSelect = document.getElementById("year");
    const monthSelect = document.getElementById("month");
    const year = yearSelect.value;
    const month = monthSelect.value;
    const monthName = monthSelect.options[monthSelect.selectedIndex].text;
    document.getElementById("monthName").textContent = monthName;
    document.getElementById("yearName").textContent = year;

    const tbody = document.querySelector("#prayerTimesTable tbody");
    tbody.innerHTML = "";

    const prayerTimes = await getPrayerTimesForMonth(year, month);

    prayerTimes.forEach((day) => {
        const row = document.createElement("tr");
        row.innerHTML = `
              <td>${day.day}</td>
              <td>${day.date}</td>
              <td>${day.datearabe}</td>
              <td>${day.fajr}</td>
              <td>${day.sun}</td>
              <td>${day.dhuhr}</td>
              <td>${day.asr}</td>
              <td>${day.maghrib}</td>
              <td>${day.isha}</td>
          `;
        if (day.day === "ศ") {
            row.style.backgroundColor = "#00B0F0";
        }
        tbody.appendChild(row);
    });
}

// โหลดปีและเดือนเริ่มต้นตอนเปิดหน้า
function initializePage() {
    populateYearOptions();

    const now = new Date();
    document.getElementById("month").value = now.getMonth() + 1;
    document.getElementById("year").value = now.getFullYear();

    updateTable();
}

async function downloadPDF() {
    const container = document.querySelector(".container");
    const buttonContainer = document.querySelector(".button-container");

    // ซ่อนปุ่มก่อน capture
    buttonContainer.style.display = "none";

    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(container, { scale: 1.5 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jspdf.jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let position = 0;

    if (pdfHeight < pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    } else {
        let heightLeft = pdfHeight;
        while (heightLeft > 0) {
            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
            position -= pageHeight;
            if (heightLeft > 0) pdf.addPage();
        }
    }

    // ดึงชื่อเดือนและปีจาก select
    const monthSelect = document.getElementById("month");
    const yearSelect = document.getElementById("year");
    const monthName = monthSelect.options[monthSelect.selectedIndex].text;
    const year = yearSelect.value;

    // ตั้งชื่อไฟล์ PDF เป็น "เดือน_ปี.pdf"
    const fileName = `เวลาละหมาด_${monthName}_${year}.pdf`;

    pdf.save(fileName);

    // แสดงปุ่มกลับ
    buttonContainer.style.display = "block";
}


window.onload = initializePage;
