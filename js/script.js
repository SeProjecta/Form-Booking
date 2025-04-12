// === Inisialisasi Firebase ===
const firebaseConfig = {
    apiKey: "AIzaSyAmGiLhdoL9cf9qt2Kl3ZrXwrOiREZPIeg",
    authDomain: "data-user-booking.firebaseapp.com",
    databaseURL: "https://data-user-booking-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "data-user-booking",
    storageBucket: "data-user-booking.appspot.com",
    messagingSenderId: "713040046724",
    appId: "1:713040046724:web:35593107504f364cc670d1"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// === Elemen DOM ===
const dateElCal = document.querySelector(".calendar .date");
const daysContainer = document.querySelector(".calendar .days");
const prevBtn = document.querySelector(".calendar .prev");
const nextBtn = document.querySelector(".calendar .next");
const todayBtn = document.querySelector(".calendar .today-btn");
const gotoBtn = document.querySelector(".calendar .goto-btn");
const dateInput = document.querySelector(".calendar .date-input");
const eventsContainer = document.querySelector(".events"); // PASTIKAN .events ADA DI DALAM .calendar
const form = document.getElementById("bookingForm");
const nameEl = document.getElementById("name");
const phoneEl = document.getElementById("phone");
const sekolahEl = document.getElementById("sekolah");
const dateElForm = document.getElementById("dateBooking");
const startEl = document.getElementById("startTime");
const endEl = document.getElementById("endTime");
const jumlahEl = document.getElementById("jumlah");
const textareaEl = document.getElementById("textarea");

// === Data & Kalender ===
const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
let today = new Date(),
    month = today.getMonth(),
    year = today.getFullYear(),
    activeDay;

async function fetchBookingStatus() {
    const snap = await db.ref("booking").once("value");
    const all = snap.val() || {};
    const result = {};
    Object.entries(all).forEach(([tgl, node]) => {
        const slot = Number(node.slot);
        if (!Number.isNaN(slot)) {
            if (slot === 0) {
                result[tgl] = "sFull"; // Slot penuh
            } else {
                result[tgl] = "full"; // Ada sesi booking
            }
        }
    });
    return result;
}

// Fungsi initCalendar
async function initCalendar() {
    console.log("Memulai inisialisasi kalender...");
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLast = new Date(year, month, 0);
    const prevDays = prevLast.getDate();
    const lastDate = lastDay.getDate();
    const dayIndex = firstDay.getDay();
    const nextDays = 7 - lastDay.getDay() - 1;

    // Tampilkan bulan dan tahun saat ini
    dateElCal.textContent = `${months[month]} ${year}`;
    console.log(`Menampilkan bulan: ${months[month]} ${year}`);

    // Ambil data booking dari Firebase
    const bookingData = await fetchBookingStatus();

    // Buat markup untuk tanggal
    let daysMarkup = "";
    for (let x = dayIndex; x > 0; x--) {
        daysMarkup += `<div class="day prev-date">${prevDays - x + 1}</div>`;
    }
    for (let i = 1; i <= lastDate; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        let classes = "day";
        if (bookingData[dateStr]) {
            classes += ` ${bookingData[dateStr]}`; // Tambahkan kelas 'full' atau 'sFull'
        }
        daysMarkup += `<div class="${classes}" data-date="${dateStr}">${i}</div>`;
    }
    for (let j = 1; j <= nextDays; j++) {
        daysMarkup += `<div class="day next-date">${j}</div>`;
    }

    // Masukkan markup ke dalam container
    daysContainer.innerHTML = daysMarkup;

    // Render event untuk bulan ini
    renderEventsForMonth();

    // Tambahkan event listener untuk klik pada tanggal
    addDayClickListener();

    // Update tampilan tanggal yang dipilih
    const todayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    updateSelectedDateDisplay(todayStr);
}
initCalendar();

function addDayClickListener() {
    document.querySelectorAll(".day[data-date]").forEach(el => {
        el.addEventListener("click", e => {
            document.querySelectorAll(".day").forEach(d => d.classList.remove("active"));
            e.target.classList.add("active");
            activeDay = parseInt(e.target.textContent, 10);
            const selectedDate = e.target.dataset.date;
            updateSelectedDateDisplay(selectedDate);

            renderEventsForSelectedDate(selectedDate);
        });
    });
}

document.querySelectorAll(".day").forEach(day => {
    day.addEventListener("click", function () {
        // Hapus kelas 'active' dari semua elemen
        document.querySelectorAll(".day").forEach(d => d.classList.remove("active"));

        // Tambahkan kelas 'active' ke elemen yang diklik
        this.classList.add("active");

        // Jika elemen memiliki kelas 'full' atau 's-full', pastikan gaya tetap sesuai
        if (this.classList.contains("full")) {
            this.classList.remove("active"); // Hapus kelas 'active'
            this.style.backgroundColor = "yellow"; // Tetap kuning
            this.style.color = "black";
        } else if (this.classList.contains("s-full")) {
            this.classList.remove("active"); // Hapus kelas 'active'
            this.style.backgroundColor = "red"; // Tetap merah
            this.style.color = "white";
        }
    });
});

// Navigasi Kalender
prevBtn.addEventListener("click", () => {
    month--;
    if (month < 0) {
        month = 11;
        year--;
    }
    initCalendar();
});
nextBtn.addEventListener("click", () => {
    month++;
    if (month > 11) {
        month = 0;
        year++;
    }
    initCalendar();
});
todayBtn.addEventListener("click", () => {
    today = new Date();
    month = today.getMonth();
    year = today.getFullYear();
    initCalendar();
});
gotoBtn.addEventListener("click", () => {
    const [m, y] = dateInput.value.split("/");
    if (m > 0 && m < 13 && y?.length === 4) {
        month = parseInt(m) - 1;
        year = parseInt(y);
        initCalendar();
    } else
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Mohon masukkan bulan dan tahun yang valid!",
            footer: '<a>Contoh: "06/2025" (juni 2025)</a>'
        });
});

// Auto Update Jam Selesai
startEl.addEventListener("change", () => {
    const [h, m] = startEl.value.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m + 30);
    endEl.value = d.toTimeString().slice(0, 5);
});

async function validateBookingTime(date, startTime, endTime, schoolId) {
    const bookingRef = db.ref(`booking/${date}/bookings`);
    const snap = await bookingRef.once("value");
    const bookings = snap.val() || {};

    let isConflict = false;
    let recommendedStartTime = null;
    let recommendedEndTime = null;

    Object.values(bookings).forEach(booking => {
        const bookedStart = booking.JamMulai;
        const bookedEnd = booking.JamSelesai;

        // Cek apakah waktu bentrok
        if (
            (startTime >= bookedStart && startTime < bookedEnd) || // Mulai di tengah sesi
            (endTime > bookedStart && endTime <= bookedEnd) || // Selesai di tengah sesi
            (startTime <= bookedStart && endTime >= bookedEnd) // Menutupi seluruh sesi
        ) {
            isConflict = true;

            // Rekomendasi waktu
            if (booking.NamaSekolah === schoolId) {
                // Jika sekolah sama, tambahkan 30 menit
                const [h, m] = bookedEnd.split(":").map(Number);
                const d = new Date();
                d.setHours(h, m);
                recommendedStartTime = d.toTimeString().slice(0, 5);

                d.setMinutes(d.getMinutes() + 30);
                recommendedEndTime = d.toTimeString().slice(0, 5);
            } else {
                // Jika sekolah berbeda, tambahkan 1 jam
                const [h, m] = bookedEnd.split(":").map(Number);
                const d = new Date();
                d.setHours(h, m + 30);
                recommendedStartTime = d.toTimeString().slice(0, 5);

                d.setMinutes(d.getMinutes() + 30);
                recommendedEndTime = d.toTimeString().slice(0, 5);
            }
        }
    });

    return { isConflict, recommendedStartTime, recommendedEndTime };
}

// Tambahkan validasi sebelum menyimpan booking
form.addEventListener("submit", async e => {
    e.preventDefault();

    // Ambil nilai dari semua input
    const nameValue = nameEl.value.trim();
    const phoneValue = phoneEl.value.trim();
    const schoolValue = sekolahEl.value.trim();
    const dateValue = dateElForm.value.trim();
    const startTimeValue = startEl.value.trim();
    const endTimeValue = endEl.value.trim();
    const jumlahValue = jumlahEl.value.trim();
    const textareaValue = textareaEl.value.trim();

    // Periksa apakah semua input telah diisi
    if (!nameValue || !phoneValue || !schoolValue || !dateValue || !startTimeValue || !endTimeValue || !jumlahValue || !textareaValue) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Mohon lengkapi semua field sebelum melakukan booking!"
        });
        return;
    }

    // Validasi waktu booking
    const { isConflict, recommendedStartTime, recommendedEndTime } = await validateBookingTime(dateValue, startTimeValue, endTimeValue, schoolValue);

    if (isConflict) {
        alert(`Waktu yang Anda pilih bentrok dengan sesi lain.\nRekomendasi waktu: ${recommendedStartTime} - ${recommendedEndTime}`);
        return;
    }

    // Referensi ke tanggal booking
    const bookingDateRef = db.ref(`booking/${dateValue}`);
    const bookingsRef = bookingDateRef.child("bookings");

    // Ambil data tanggal untuk memeriksa slot
    const dateSnap = await bookingDateRef.once("value");
    const dateData = dateSnap.val() || {};
    let currentSlot = dateData.slot || 5; // Default slot adalah 5 jika tanggal baru

    if (currentSlot <= 0) {
        alert("Slot untuk tanggal ini sudah penuh!");
        return;
    }

    // Simpan booking baru
    await bookingsRef.push({
        Nama: nameValue,
        NoWa: phoneValue,
        NamaSekolah: schoolValue,
        JamMulai: startTimeValue,
        JamSelesai: endTimeValue,
        JumlahSiswa: `${jumlahValue} orang`,
        PesanTambahan: textareaValue
    });

    // Kurangi slot
    currentSlot -= 1;

    // Perbarui slot dan status di Firebase
    await bookingDateRef.update({
        slot: currentSlot,
        status: currentSlot === 0 ? "sFull" : "full" // Tandai tanggal sebagai 'sFull' jika slot habis, atau 'full' jika ada sesi
    });

    Swal.fire({
        icon: "success",
        title: "Booking berhasil!",
        text: "Data booking Anda telah disimpan."
    });

    form.reset();
    initCalendar();
});

// menampilkan sekolah
let sekolahData = {};

// Ambil data sekolah dari Firebase
db.ref("sekolah")
    .once("value")
    .then(snapshot => {
        sekolahData = snapshot.val();
        if (sekolahData) {
            // Kosongkan dropdown sebelum menambahkan opsi
            sekolahDropdown.innerHTML = "<option selected>Pilih Sekolah</option>";

            // Tambahkan opsi ke dropdown
            Object.entries(sekolahData).forEach(([id, namaSekolah]) => {
                const option = document.createElement("option");
                option.value = id;
                option.textContent = namaSekolah;
                sekolahDropdown.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error("Gagal mengambil data sekolah:", error);
    });

async function renderEventsForMonth() {
    const snap = await db.ref("booking").once("value");
    const data = snap.val() || {};

    eventsContainer.innerHTML = "";

    const entries = Object.entries(data)
        .filter(([dateStr]) => {
            const [y, m] = dateStr.split("-").map(Number);
            return y === year && m === month + 1;
        })
        .sort(([a], [b]) => new Date(a) - new Date(b));

    if (!entries.length) {
        eventsContainer.innerHTML = "<p>Tidak ada booking di bulan ini.</p>";
        return;
    }

    entries.forEach(([tgl, entry]) => {
        const wrapper = document.createElement("div");
        wrapper.className = "data-booking";

        wrapper.innerHTML += `<div class="dataTanggalbooking">Booking Pada ${tgl} <span class="slot">(${entry.slot ?? 0} slot tersisa)</span></div>`;

        const bookings = entry.bookings || {};

        if (Object.keys(bookings).length === 0) {
            wrapper.innerHTML += `<p class="no-booking">Belum ada booking.</p>`;
        } else {
            Object.values(bookings).forEach(b => {
                const divB = document.createElement("div");
                divB.className = "booking-item";

                // Ganti ID dengan nama menggunakan schoolData
                const namaSekolah = sekolahData[b.NamaSekolah] || b.NamaSekolah;

                divB.innerHTML = `
                    <p><strong>Nama: ${b.Nama}</strong><br>
                    No WA: ${b.NoWa}<br> 
                    Sekolah: ${namaSekolah}<br>
                    Waktu: ${b.JamMulai} - ${b.JamSelesai}<br>
                   Jumlah Siswa: ${b.JumlahSiswa}<br>
                    Pesan: ${b.PesanTambahan || "-"}
                    </p>`;

                wrapper.appendChild(divB);
            });
        }

        eventsContainer.appendChild(wrapper);
    });
}

// Jalankan awal
initCalendar();

//script update tanggal di events
function updateSelectedDateDisplay(dateStr) {
    const dateObj = new Date(dateStr);
    const dayName = dateObj.toLocaleDateString("id-ID", { weekday: "long" });
    const day = dateObj.getDate();
    const monthName = dateObj.toLocaleDateString("id-ID", { month: "long" });
    const year = dateObj.getFullYear();

    document.querySelector(".today-date .event-day").textContent = dayName;
    document.querySelector(".today-date .event-date").textContent = `${day} ${monthName} ${year}`;
}

// menampilkan booking untuk tanggal yang dipilih
async function renderEventsForSelectedDate(dateStr) {
    const snap = await db.ref("booking/" + dateStr).once("value");
    const data = snap.val();

    eventsContainer.innerHTML = ""; // Kosongkan dulu

    const wrapper = document.createElement("div");
    wrapper.className = "data-booking";
    wrapper.innerHTML = `<div class="dataTanggalbooking">Booking Pada ${dateStr} <span class="slot">(${data?.slot ?? 0} slot tersisa)</span></div>`;

    const bookings = data?.bookings || {};
    if (Object.keys(bookings).length === 0) {
        wrapper.innerHTML += `<p class="no-booking">Belum ada booking.</p>`;
    } else {
        Object.values(bookings).forEach(b => {
            const divB = document.createElement("div");
            divB.className = "booking-item";
            const namaSekolah = sekolahData[b.NamaSekolah] || b.NamaSekolah; // Jika tidak ditemukan, gunakan ID sebagai fallback
            divB.innerHTML = `
                <p><strong>Nama: ${b.Nama}</strong><br>
                    No WA: ${b.NoWa}<br> 
                    Sekolah: ${namaSekolah}<br>
                    Waktu: ${b.JamMulai} - ${b.JamSelesai}<br>
                   Jumlah Siswa: ${b.JumlahSiswa}<br>
                    Pesan: ${b.PesanTambahan || "-"}
                    </p>
            `;
            wrapper.appendChild(divB);
        });
    }

    eventsContainer.appendChild(wrapper);
}


// Pastikan DOM selesai dimuat sebelum inisialisasi kalender
document.addEventListener("DOMContentLoaded", () => {
    console.log("Inisialisasi kalender...");
    if (dateElCal && daysContainer) {
        initCalendar(); // Panggil fungsi untuk memuat kalender
    } else {
        console.error("Elemen DOM untuk kalender tidak ditemukan!");
    }
});

// Set tanggal default di formulir ke tanggal hari ini
document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("date"); // Pastikan ID input tanggal adalah 'date'
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0"); // Bulan dimulai dari 0
        const dd = String(today.getDate()).padStart(2, "0");
        dateInput.value = `${yyyy}-${mm}-${dd}`; // Format YYYY-MM-DD
    }
});

function updateEndTime() {
    const startEl = document.getElementById("startTime");
    const endEl = document.getElementById("endTime");
    if (startEl && endEl) {
        const [h, m] = startEl.value.split(":").map(Number);
        const d = new Date();
        d.setHours(h + 1, m); // Tambahkan 1 jam ke waktu mulai
        endEl.value = d.toTimeString().slice(0, 5); // Format waktu menjadi HH:MM
    } else {
        console.error("Elemen startTime atau endTime tidak ditemukan!");
    }
}

const sekolahDropdown = document.getElementById("sekolah");

// Ambil data sekolah dari Firebase
db.ref("sekolah")
    .once("value")
    .then(snapshot => {
        const sekolahData = snapshot.val();
        if (sekolahData) {
            // Kosongkan dropdown sebelum menambahkan opsi
            sekolahDropdown.innerHTML = "<option selected>Pilih Sekolah</option>";

            // Tambahkan opsi ke dropdown
            Object.entries(sekolahData).forEach(([id, namaSekolah]) => {
                const option = document.createElement("option");
                option.value = id;
                option.textContent = namaSekolah;
                sekolahDropdown.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error("Gagal mengambil data sekolah:", error);
    });
