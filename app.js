document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startDateInput = document.getElementById('start-date');
    const startDateLabel = document.getElementById('start-date-label');
    const intervalWeeksInput = document.getElementById('interval-weeks');
    const intervalDaysInput = document.getElementById('interval-days');
    const presetButtons = document.querySelectorAll('.btn-preset');
    const bufferDaysInput = document.getElementById('buffer-days');
    
    // Mode switcher elements
    const tabModeA = document.getElementById('tab-mode-a');
    const tabModeB = document.getElementById('tab-mode-b');
    const modeAInputs = document.getElementById('mode-a-inputs');
    const modeBInputs = document.getElementById('mode-b-inputs');
    const targetDateInput = document.getElementById('target-date');
    
    // Medication elements
    const medNameInput = document.getElementById('med-name');
    const medFreqInput = document.getElementById('med-freq');
    const medTimesSelect = document.getElementById('med-times');
    const btnAddMed = document.getElementById('btn-add-med');
    const medsListBody = document.getElementById('meds-list-body');
    const emptyState = document.getElementById('empty-state');
    
    // Timeline elements
    const pillsMorning = document.getElementById('pills-เช้า');
    const pillsNoon = document.getElementById('pills-กลางวัน');
    const pillsEvening = document.getElementById('pills-เย็น');
    const pillsBedtime = document.getElementById('pills-ก่อนนอน');
    
    // Output displays
    const nextDateDisplay = document.getElementById('next-date-display');
    const nextDayDisplay = document.getElementById('next-day-display');
    const totalDaysDisplay = document.getElementById('total-days-display');
    const totalDaysBreakdown = document.getElementById('total-days-breakdown');
    
    const weekendWarning = document.getElementById('weekend-warning');
    const noWeekendAlert = document.getElementById('no-weekend-alert');
    const btnShiftPrev = document.getElementById('btn-shift-prev');
    const btnShiftNext = document.getElementById('btn-shift-next');
    
    const btnClearAll = document.getElementById('btn-clear-all');
    const btnPrint = document.getElementById('btn-print');
    const btnThemeToggle = document.getElementById('theme-toggle');
    
    // Print Area Elements
    const printStartDate = document.getElementById('print-start-date');
    const printDuration = document.getElementById('print-duration');
    const printNextDate = document.getElementById('print-next-date');
    const printBuffer = document.getElementById('print-buffer');
    const printMedsTableBody = document.getElementById('print-meds-table-body');
    const printGenerationTime = document.getElementById('print-generation-time');

    // App State
    let currentMode = 'a'; // 'a' = คำนวณวันนัดถัดไป, 'b' = คำนวณยาถึงวันนัดเดิม
    let medications = [];
    let calculatedIntervalDays = 0; // Days between start and next appt
    let totalDaysForMedication = 0; // Interval + buffer
    let nextAppointmentDateObj = null;

    const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // Initialize Default Values
    const today = new Date();
    startDateInput.value = today.toISOString().split('T')[0];
    
    // Set Target Date default for Mode B: today + 28 days
    const defaultTarget = new Date(today);
    defaultTarget.setDate(today.getDate() + 28);
    targetDateInput.value = defaultTarget.toISOString().split('T')[0];
    
    // Default preset: 4 weeks (28 days)
    setActivePreset(4);

    // Theme Toggle Logic
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (btnThemeToggle) {
            btnThemeToggle.querySelector('span').textContent = 'โหมดปกติ';
            btnThemeToggle.querySelector('i').className = 'fa-solid fa-sun';
        }
    }

    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            if (isDark) {
                btnThemeToggle.querySelector('span').textContent = 'โหมดปกติ';
                btnThemeToggle.querySelector('i').className = 'fa-solid fa-sun';
            } else {
                btnThemeToggle.querySelector('span').textContent = 'โหมดมืด';
                btnThemeToggle.querySelector('i').className = 'fa-solid fa-moon';
            }
        });
    }

    // Mode Switcher Event Listeners
    tabModeA.addEventListener('click', () => switchMode('a'));
    tabModeB.addEventListener('click', () => switchMode('b'));

    // Event Listeners for Date Inputs
    startDateInput.addEventListener('change', calculateAll);
    targetDateInput.addEventListener('change', calculateAll);
    
    intervalWeeksInput.addEventListener('input', () => {
        if (intervalWeeksInput.value !== '') {
            intervalDaysInput.value = '';
            removePresetActive();
            // Check if matches preset
            const w = parseInt(intervalWeeksInput.value);
            const presetBtn = document.querySelector(`.btn-preset[data-weeks="${w}"]`);
            if (presetBtn) presetBtn.classList.add('active');
        }
        calculateAll();
    });
    
    intervalDaysInput.addEventListener('input', () => {
        if (intervalDaysInput.value !== '') {
            intervalWeeksInput.value = '';
            removePresetActive();
        }
        calculateAll();
    });
    
    bufferDaysInput.addEventListener('input', calculateAll);

    // Preset button click events
    presetButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const weeks = parseInt(e.target.dataset.weeks);
            setActivePreset(weeks);
            calculateAll();
        });
    });

    // Shift Date Buttons (for weekend handling)
    btnShiftPrev.addEventListener('click', () => {
        shiftAppointmentDays(-1);
    });
    
    btnShiftNext.addEventListener('click', () => {
        shiftAppointmentDays(1);
    });

    // Medications Listeners
    btnAddMed.addEventListener('click', addMedication);
    
    // Quick Drug Preset Click Event (WOW Feature - Instant Auto-Add)
    document.querySelectorAll('.btn-drug-preset').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const name = btn.dataset.name;
            const freq = parseFloat(btn.dataset.freq);
            const times = btn.dataset.times;
            const isBedtime = btn.dataset.slot === 'ก่อนนอน';
            
            const newMed = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                name,
                freq,
                times: isBedtime ? '1-bedtime' : times
            };
            
            medications.push(newMed);
            renderMedications();
            renderTimeline();
        });
    });
    
    // Clear All
    btnClearAll.addEventListener('click', resetApp);
    
    // Print
    btnPrint.addEventListener('click', printSlip);

    // Functions
    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'a') {
            tabModeA.classList.add('active');
            tabModeB.classList.remove('active');
            modeAInputs.style.display = 'block';
            modeBInputs.style.display = 'none';
            startDateLabel.innerHTML = `<i class="fa-solid fa-calendar-day"></i> วันที่ผู้ป่วยมาวันนี้ / วันเริ่มต้นจ่ายยา`;
        } else {
            tabModeA.classList.remove('active');
            tabModeB.classList.add('active');
            modeAInputs.style.display = 'none';
            modeBInputs.style.display = 'block';
            startDateLabel.innerHTML = `<i class="fa-solid fa-calendar-day"></i> วันที่ผู้ป่วยมาวันนี้`;
        }
        calculateAll();
    }

    function removePresetActive() {
        presetButtons.forEach(btn => btn.classList.remove('active'));
    }

    function setActivePreset(weeks) {
        removePresetActive();
        const activeBtn = document.querySelector(`.btn-preset[data-weeks="${weeks}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        intervalWeeksInput.value = weeks;
        intervalDaysInput.value = '';
    }

    function shiftAppointmentDays(daysToShift) {
        if (!nextAppointmentDateObj) return;
        
        nextAppointmentDateObj.setDate(nextAppointmentDateObj.getDate() + daysToShift);
        
        if (currentMode === 'a') {
            const start = new Date(startDateInput.value);
            const diffTime = Math.abs(nextAppointmentDateObj - start);
            calculatedIntervalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            intervalWeeksInput.value = '';
            intervalDaysInput.value = calculatedIntervalDays;
            removePresetActive();
        } else {
            targetDateInput.value = nextAppointmentDateObj.toISOString().split('T')[0];
        }
        
        calculateAll();
    }

    function formatDateThai(date) {
        if (!date) return '-';
        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543;
        return `${day} ${month} พ.ศ. ${year}`;
    }

    function calculateAll() {
        const startVal = startDateInput.value;
        if (!startVal) return;

        const startDate = new Date(startVal);
        let daysToAdd = 0;

        if (currentMode === 'a') {
            const weeks = parseInt(intervalWeeksInput.value) || 0;
            const days = parseInt(intervalDaysInput.value) || 0;

            if (weeks > 0) {
                daysToAdd = weeks * 7;
            } else if (days > 0) {
                daysToAdd = days;
            }

            calculatedIntervalDays = daysToAdd;
            
            const nextDate = new Date(startDate);
            nextDate.setDate(startDate.getDate() + daysToAdd);
            nextAppointmentDateObj = nextDate;
        } else {
            const targetVal = targetDateInput.value;
            if (!targetVal) return;

            const targetDate = new Date(targetVal);
            nextAppointmentDateObj = targetDate;

            const timeDiff = targetDate.getTime() - startDate.getTime();
            daysToAdd = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysToAdd < 0) {
                daysToAdd = 0;
            }
            calculatedIntervalDays = daysToAdd;
        }

        const bufferDays = parseInt(bufferDaysInput.value) || 0;
        totalDaysForMedication = calculatedIntervalDays + bufferDays;

        if (calculatedIntervalDays > 0) {
            nextDateDisplay.textContent = formatDateThai(nextAppointmentDateObj);
            const dayOfWeek = nextAppointmentDateObj.getDay();
            nextDayDisplay.textContent = thaiDays[dayOfWeek];

            totalDaysDisplay.textContent = `${totalDaysForMedication} วัน`;
            if (currentMode === 'a') {
                totalDaysBreakdown.textContent = `(ระยะเวลานัด ${calculatedIntervalDays} วัน + สำรอง ${bufferDays} วัน)`;
            } else {
                totalDaysBreakdown.textContent = `(ระยะเวลาถึงวันนัดเดิม ${calculatedIntervalDays} วัน + สำรอง ${bufferDays} วัน)`;
            }

            // Weekend Check
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                weekendWarning.style.display = 'flex';
                noWeekendAlert.style.display = 'none';
                
                if (dayOfWeek === 6) { // Saturday
                    btnShiftPrev.innerHTML = `<i class="fa-solid fa-arrow-left"></i> เลื่อนคิวเป็นวันศุกร์ (-1 วัน)`;
                    btnShiftNext.innerHTML = `เลื่อนเป็นวันจันทร์ (+2 วัน) <i class="fa-solid fa-arrow-right"></i>`;
                    btnShiftPrev.onclick = () => shiftAppointmentDays(-1);
                    btnShiftNext.onclick = () => shiftAppointmentDays(2);
                } else { // Sunday
                    btnShiftPrev.innerHTML = `<i class="fa-solid fa-arrow-left"></i> เลื่อนคิวเป็นวันศุกร์ (-2 วัน)`;
                    btnShiftNext.innerHTML = `เลื่อนเป็นวันจันทร์ (+1 วัน) <i class="fa-solid fa-arrow-right"></i>`;
                    btnShiftPrev.onclick = () => shiftAppointmentDays(-2);
                    btnShiftNext.onclick = () => shiftAppointmentDays(1);
                }
            } else {
                weekendWarning.style.display = 'none';
                noWeekendAlert.style.display = 'block';
            }
        } else {
            nextDateDisplay.textContent = '-';
            nextDayDisplay.textContent = '-';
            totalDaysDisplay.textContent = '0 วัน';
            totalDaysBreakdown.textContent = '-';
            weekendWarning.style.display = 'none';
            noWeekendAlert.style.display = 'none';
        }

        renderMedications();
        renderTimeline();
    }

    function addMedication(e) {
        e.preventDefault();
        
        const name = medNameInput.value.trim();
        const freq = parseFloat(medFreqInput.value);
        const times = medTimesSelect.value;

        if (!name) {
            alert('กรุณากรอกชื่อยา');
            medNameInput.focus();
            return;
        }

        if (isNaN(freq) || freq <= 0) {
            alert('กรุณาระบุจำนวนเม็ดต่อครั้งให้ถูกต้อง');
            medFreqInput.focus();
            return;
        }

        const newMed = {
            id: Date.now().toString(),
            name,
            freq,
            times
        };

        medications.push(newMed);
        
        medNameInput.value = '';
        medFreqInput.value = '';
        medTimesSelect.value = '1';
        medNameInput.focus();

        renderMedications();
        renderTimeline();
    }

    function deleteMedication(id) {
        medications = medications.filter(med => med.id !== id);
        renderMedications();
        renderTimeline();
    }

    function getDoseText(med) {
        if (med.times === '1-bedtime') {
            return `${med.freq} เม็ด ก่อนนอน`;
        }
        const freqVal = parseInt(med.times) || 1;
        return `${med.freq} เม็ด, วันละ ${freqVal} ครั้ง`;
    }

    function getDailyTotal(med) {
        if (med.times === '1-bedtime') {
            return med.freq;
        }
        const freqVal = parseInt(med.times) || 1;
        return med.freq * freqVal;
    }

    function renderMedications() {
        medsListBody.innerHTML = '';

        if (medications.length === 0) {
            emptyState.style.display = 'block';
            medsListBody.appendChild(emptyState);
            return;
        }

        emptyState.style.display = 'none';

        medications.forEach(med => {
            const dailyDose = getDailyTotal(med);
            const totalQty = Math.ceil(dailyDose * totalDaysForMedication);

            const row = document.createElement('div');
            row.className = 'med-item';
            row.innerHTML = `
                <div class="med-item-name">${med.name}</div>
                <div class="med-item-dose">${getDoseText(med)} (วันละ ${dailyDose} เม็ด)</div>
                <div class="med-item-calc">${totalQty} เม็ด</div>
                <div>
                    <button class="btn-delete" data-id="${med.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            
            row.querySelector('.btn-delete').addEventListener('click', () => {
                deleteMedication(med.id);
            });

            medsListBody.appendChild(row);
        });
    }

    // Dynamic Visual Timeline rendering (WOW feature)
    function renderTimeline() {
        // Clear slots
        pillsMorning.innerHTML = '';
        pillsNoon.innerHTML = '';
        pillsEvening.innerHTML = '';
        pillsBedtime.innerHTML = '';

        const emptyBadge = () => {
            const span = document.createElement('span');
            span.className = 'timeline-pill-badge';
            span.style.color = 'var(--text-dim)';
            span.textContent = 'ไม่มี';
            return span;
        };

        let slotsHasPills = { morning: false, noon: false, evening: false, bedtime: false };

        medications.forEach(med => {
            const addBadge = (container, slotKey) => {
                const span = document.createElement('span');
                span.className = 'timeline-pill-badge';
                span.title = `${med.name} - ${med.freq} เม็ด`;
                span.textContent = `${med.name} (${med.freq} ม.)`;
                container.appendChild(span);
                slotsHasPills[slotKey] = true;
            };

            const t = med.times;
            if (t === '1') { // เช้า
                addBadge(pillsMorning, 'morning');
            } else if (t === '2') { // เช้า, เย็น
                addBadge(pillsMorning, 'morning');
                addBadge(pillsEvening, 'evening');
            } else if (t === '3') { // เช้า, กลางวัน, เย็น
                addBadge(pillsMorning, 'morning');
                addBadge(pillsNoon, 'noon');
                addBadge(pillsEvening, 'evening');
            } else if (t === '4') { // เช้า, กลางวัน, เย็น, ก่อนนอน
                addBadge(pillsMorning, 'morning');
                addBadge(pillsNoon, 'noon');
                addBadge(pillsEvening, 'evening');
                addBadge(pillsBedtime, 'bedtime');
            } else if (t === '1-bedtime') { // ก่อนนอน
                addBadge(pillsBedtime, 'bedtime');
            }
        });

        // Add empty badges if slot has no meds
        if (!slotsHasPills.morning) pillsMorning.appendChild(emptyBadge());
        if (!slotsHasPills.noon) pillsNoon.appendChild(emptyBadge());
        if (!slotsHasPills.evening) pillsEvening.appendChild(emptyBadge());
        if (!slotsHasPills.bedtime) pillsBedtime.appendChild(emptyBadge());
    }

    function resetApp() {
        if (confirm('คุณต้องการล้างข้อมูลแผนงานนี้หรือไม่?')) {
            medications = [];
            startDateInput.value = today.toISOString().split('T')[0];
            
            const defaultTarget = new Date(today);
            defaultTarget.setDate(today.getDate() + 28);
            targetDateInput.value = defaultTarget.toISOString().split('T')[0];
            
            bufferDaysInput.value = '0';
            medNameInput.value = '';
            medFreqInput.value = '';
            medTimesSelect.value = '1';
            switchMode('a');
            setActivePreset(4);
            calculateAll();
        }
    }

    function printSlip() {
        if (calculatedIntervalDays === 0) {
            alert('กรุณากำหนดระยะเวลาการนัดหมายก่อนสั่งพิมพ์');
            return;
        }

        printStartDate.textContent = formatDateThai(new Date(startDateInput.value));
        
        if (currentMode === 'a') {
            printDuration.textContent = `${calculatedIntervalDays} วัน (${intervalWeeksInput.value ? intervalWeeksInput.value + ' สัปดาห์' : 'กำหนดเอง'})`;
        } else {
            printDuration.textContent = `${calculatedIntervalDays} วัน (คำนวณแบบจ่ายยาถึงวันนัดหมายเดิม)`;
        }
        
        printNextDate.textContent = `${formatDateThai(nextAppointmentDateObj)} (${thaiDays[nextAppointmentDateObj.getDay()]})`;
        printBuffer.textContent = `${bufferDaysInput.value || 0} วัน (ยอดคำนวณยารวมทั้งหมด ${totalDaysForMedication} วัน)`;
        
        const now = new Date();
        printGenerationTime.textContent = now.toLocaleString('th-TH');

        printMedsTableBody.innerHTML = '';
        if (medications.length === 0) {
            printMedsTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">ไม่มีรายการยา</td></tr>`;
        } else {
            medications.forEach(med => {
                const dailyDose = getDailyTotal(med);
                const totalQty = Math.ceil(dailyDose * totalDaysForMedication);
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${med.name}</strong></td>
                    <td>ทานวันละ ${dailyDose} เม็ด (${getDoseText(med)})</td>
                    <td style="text-align: right; font-weight: bold;">${totalQty} เม็ด</td>
                `;
                printMedsTableBody.appendChild(tr);
            });
        }

        window.print();
    }

    calculateAll();
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully.', reg))
            .catch(err => console.log('Service Worker registration failed.', err));
    });
}
