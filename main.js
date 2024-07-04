async function getPrayerTimesForMonth(year, month) {
    const response = await fetch(`https://api.aladhan.com/v1/calendarByAddress/${year}/${month}?address=Songkhla, Thailand`);
    const data = await response.json();

    function addFiveMinutes(timeStr) {
        let [hours, minutes] = timeStr.split(':');
        let date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        date.setMinutes(date.getMinutes() + 5);
        let newHours = date.getHours().toString().padStart(2, '0');
        let newMinutes = date.getMinutes().toString().padStart(2, '0');
        return `${newHours}:${newMinutes}`;
    }

    function translateAndAbbreviateDay(day) {
        switch (day) {
            case 'Monday':
                return 'จ';
            case 'Tuesday':
                return 'อ';
            case 'Wednesday':
                return 'พ';
            case 'Thursday':
                return 'พฤ';
            case 'Friday':
                return 'ศ';
            case 'Saturday':
                return 'ส';
            case 'Sunday':
                return 'อา';
            default:
                return day;
        }
    }

    const prayerTimes = data.data.map(item => {
        const day = item.date.gregorian.weekday.en;
        const dayTh = translateAndAbbreviateDay(day);
        const formattedDate = item.date.gregorian.day;
        const hijriDate = item.date.hijri.date;
        const hijriMonthEn = item.date.hijri.month.en;
        const hijriYear = item.date.hijri.year;
        const formattedHijriDate = `${hijriDate.split('-')[0]}-${hijriMonthEn}-${hijriYear}`;

        return {
            day: dayTh,
            date: formattedDate,
            datearabe: formattedHijriDate,
            fajr: addFiveMinutes(item.timings.Fajr.replace(' (+07)', '')),
            sun: addFiveMinutes(item.timings.Sunrise.replace(' (+07)', '')),
            dhuhr: addFiveMinutes(item.timings.Dhuhr.replace(' (+07)', '')),
            asr: addFiveMinutes(item.timings.Asr.replace(' (+07)', '')),
            maghrib: addFiveMinutes(item.timings.Maghrib.replace(' (+07)', '')),
            isha: addFiveMinutes(item.timings.Isha.replace(' (+07)', ''))
        };
    });

    return prayerTimes;
}

async function updateTable() {
    const yearSelect = document.getElementById("year");
    const monthSelect = document.getElementById("month");
    const year = yearSelect.value;
    const month = monthSelect.value;
    const monthName = monthSelect.options[monthSelect.selectedIndex].text;
    document.getElementById("monthName").textContent = monthName;

    const tbody = document.querySelector("#prayerTimesTable tbody");

    tbody.innerHTML = "";

    const prayerTimes = await getPrayerTimesForMonth(year, month);

    prayerTimes.forEach(day => {
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
        if (day.day === 'ศ') {
            row.style.backgroundColor = '#00B0F0';
        }
        tbody.appendChild(row);
    });
}

function initializePage() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    document.getElementById("month").value = currentMonth;
    document.getElementById("year").value = currentYear;

    updateTable();
}

window.onload = initializePage;
