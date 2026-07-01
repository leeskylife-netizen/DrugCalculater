document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startDateInput = document.getElementById('start-date');
    const intervalWeeksInput = document.getElementById('interval-weeks');
    const intervalDaysInput = document.getElementById('interval-days');
    const presetButtons = document.querySelectorAll('.btn-preset');
    const bufferDaysInput = document.getElementById('buffer-days');
    
    const medNameInput = document.getElementById('med-name');
    const medFreqInput = document.getElementById('med-freq');
    const medTimesInput = document.getElementById('med-times');
    const btnAddMed = document.getElementById('btn-add-med');
    const medsListBody = document.getElementById('meds-list-body');
    const emptyState = document.getElementById('empty-state');
    
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
    
    // Print Area Elements
    const printStartDate = document.getElementById('print-start-date');
    const printDuration = document.getElementById('print-duration');
    const printNextDate = document.getElementById('print-next-date');
    const printBuffer = document.getElementById('print-buffer');
    const printMedsTableBody = document.getElementById('print-meds-table-body');
    const printGenerationTime = document.getElementById('print-generation-time');

    // App State
    let medications = [];
    let calculatedIntervalDays = 0; // Days from weeks + days input
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
    
    // Default preset: 4 weeks (28 days)
    setActivePreset(4);

    // Event Listeners for Date Inputs
    startDateInput.addEventListener('change', calculateAll);
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
        shiftAppointmentDays(-1); // Shift 1 day back (e.g. Saturday to Friday)
    });
    
    btnShiftNext.addEventListener('click', () => {
        shiftAppointmentDays(1); // Shift to next workday
    });

    // Medications Listeners
    btnAddMed.addEventListener('click', addMedication);
    
    // Clear All
    btnClearAll.addEventListener('click', resetApp);
    
    // Print
    btnPrint.addEventListener('click', printSlip);

    // Functions
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
        
        // Adjust the next appointment date
        nextAppointmentDateObj.setDate(nextAppointmentDateObj.getDate() + daysToShift);
        
        // Recalculate how many interval days this results in
        const start = new Date(startDateInput.value);
        const diffTime = Math.abs(nextAppointmentDateObj - start);
        calculatedIntervalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Update days input to reflect custom shift
        intervalWeeksInput.value = '';
        intervalDaysInput.value = calculatedIntervalDays;
        removePresetActive();
        
        calculateAll();
    }

    function formatDateThai(date) {
        if (!date) return '-';
        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543; // Buddhist Era
        return `${day} ${month} พ.ศ. ${year}`;
    }

    function calculateAll() {
        const startVal = startDateInput.value;
        if (!startVal) return;

        const startDate = new Date(startVal);
        let daysToAdd = 0;

        const weeks = parseInt(intervalWeeksInput.value) || 0;
        const days = parseInt(intervalDaysInput.value) || 0;

        if (weeks > 0) {
            daysToAdd = weeks * 7;
        } else if (days > 0) {
            daysToAdd = days;
        }

        calculatedIntervalDays = daysToAdd;
        
        // Target Next Appointment Date
        const nextDate = new Date(startDate);
        nextDate.setDate(startDate.getDate() + daysToAdd);
        nextAppointmentDateObj = nextDate;

        // Check buffer days
        const bufferDays = parseInt(bufferDaysInput.value) || 0;
        totalDaysForMedication = daysToAdd + bufferDays;

        // Render Appointment Outputs
        if (daysToAdd > 0) {
            nextDateDisplay.textContent = formatDateThai(nextDate);
            const dayOfWeek = nextDate.getDay();
            nextDayDisplay.textContent = thaiDays[dayOfWeek];

            // Render Breakdown
            totalDaysDisplay.textContent = `${totalDaysForMedication} วัน`;
            totalDaysBreakdown.textContent = `(ระยะเวลานัด ${daysToAdd} วัน + สำรอง ${bufferDays} วัน)`;

            // Weekend Check
            if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 = Sunday, 6 = Saturday
                weekendWarning.style.display = 'flex';
                noWeekendAlert.style.display = 'none';
                
                // Customize shift button texts
                if (dayOfWeek === 6) { // Saturday
                    btnShiftPrev.innerHTML = `<i class="fa-solid fa-arrow-left"></i> เลื่อนขึ้น 1 วัน (วันศุกร์)`;
                    btnShiftNext.innerHTML = `<i class="fa-solid fa-arrow-right"></i> เลื่อนลง 2 วัน (วันจันทร์)`;
                    // Setup custom shift offsets
                    btnShiftPrev.onclick = () => shiftAppointmentDays(-1);
                    btnShiftNext.onclick = () => shiftAppointmentDays(2);
                } else { // Sunday
                    btnShiftPrev.innerHTML = `<i class="fa-solid fa-arrow-left"></i> เลื่อนขึ้น 2 วัน (วันศุกร์)`;
                    btnShiftNext.innerHTML = `<i class="fa-solid fa-arrow-right"></i> เลื่อนลง 1 วัน (วันจันทร์)`;
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

        // Refresh medication calculations
        renderMedications();
    }

    function addMedication(e) {
        e.preventDefault();
        
        const name = medNameInput.value.trim();
        const freq = parseFloat(medFreqInput.value);
        const times = parseInt(medTimesInput.value) || 1;

        if (!name) {
            alert('กรุณากรอกชื่อยา');
            medNameInput.focus();
            return;
        }

        if (isNaN(freq) || freq <= 0) {
            alert('กรุณาระบุจำนวนเม็ดต่อวันให้ถูกต้อง');
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
        
        // Reset Inputs
        medNameInput.value = '';
        medFreqInput.value = '';
        medTimesInput.value = '1';
        medNameInput.focus();

        renderMedications();
    }

    function deleteMedication(id) {
        medications = medications.filter(med => med.id !== id);
        renderMedications();
    }

    function renderMedications() {
        // Clear body
        medsListBody.innerHTML = '';

        if (medications.length === 0) {
            emptyState.style.display = 'block';
            medsListBody.appendChild(emptyState);
            return;
        }

        emptyState.style.display = 'none';

        medications.forEach(med => {
            const dailyDose = med.freq * med.times;
            const totalQty = Math.ceil(dailyDose * totalDaysForMedication);

            const row = document.createElement('div');
            row.className = 'med-item';
            row.innerHTML = `
                <div class="med-item-name">${med.name}</div>
                <div class="med-item-dose">${med.freq} เม็ด, วันละ ${med.times} ครั้ง (ทานวันละ ${dailyDose} เม็ด)</div>
                <div class="med-item-calc">${totalQty} เม็ด</div>
                <div>
                    <button class="btn-delete" data-id="${med.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            
            // Delete Listener
            row.querySelector('.btn-delete').addEventListener('click', () => {
                deleteMedication(med.id);
            });

            medsListBody.appendChild(row);
        });
    }

    function resetApp() {
        if (confirm('คุณต้องการล้างข้อมูลทั้งหมดหรือไม่?')) {
            medications = [];
            startDateInput.value = today.toISOString().split('T')[0];
            bufferDaysInput.value = '0';
            medNameInput.value = '';
            medFreqInput.value = '';
            medTimesInput.value = '1';
            setActivePreset(4);
            calculateAll();
        }
    }

    function printSlip() {
        if (calculatedIntervalDays === 0) {
            alert('กรุณากำหนดระยะเวลาการนัดหมายก่อนสั่งพิมพ์');
            return;
        }

        // Fill Print Details
        printStartDate.textContent = formatDateThai(new Date(startDateInput.value));
        printDuration.textContent = `${calculatedIntervalDays} วัน (${intervalWeeksInput.value ? intervalWeeksInput.value + ' สัปดาห์' : 'กำหนดเอง'})`;
        printNextDate.textContent = `${formatDateThai(nextAppointmentDateObj)} (${thaiDays[nextAppointmentDateObj.getDay()]})`;
        printBuffer.textContent = `${bufferDaysInput.value || 0} วัน (ยอดคำนวณยารวมทั้งหมด ${totalDaysForMedication} วัน)`;
        
        // Current Time for Receipt
        const now = new Date();
        printGenerationTime.textContent = now.toLocaleString('th-TH');

        // Populate Table
        printMedsTableBody.innerHTML = '';
        if (medications.length === 0) {
            printMedsTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">ไม่มีรายการยา</td></tr>`;
        } else {
            medications.forEach(med => {
                const dailyDose = med.freq * med.times;
                const totalQty = Math.ceil(dailyDose * totalDaysForMedication);
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${med.name}</strong></td>
                    <td>ทานวันละ ${dailyDose} เม็ด (${med.freq} เม็ด x ${med.times} ครั้ง)</td>
                    <td style="text-align: right; font-weight: bold;">${totalQty} เม็ด</td>
                `;
                printMedsTableBody.appendChild(tr);
            });
        }

        // Trigger print window
        window.print();
    }

    // Initial Calculation
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
