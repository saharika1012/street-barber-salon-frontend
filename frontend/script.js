const API = "/api";
const servicesGrid = document.getElementById("servicesGrid");
const serviceSelect = document.getElementById("serviceId");
const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");
const appointmentsBody = document.getElementById("appointmentsBody");
const dashboardMessage = document.getElementById("dashboardMessage");
let services = [];

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type || ""}`;
}
function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}
async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
function renderServices() {
  servicesGrid.innerHTML = "";
  serviceSelect.innerHTML = '<option value="">Choose a service</option>';
  services.forEach(service => {
    const card = document.createElement("article");
    card.className = "service-card";
    const icon = document.createElement("div");
    icon.className = "service-icon";
    icon.textContent = service.icon;
    const title = document.createElement("h3");
    title.textContent = service.name;
    const price = document.createElement("div");
    price.className = "price";
    price.textContent = money(service.price);
    const duration = document.createElement("div");
    duration.className = "duration";
    duration.textContent = service.duration;
    card.append(icon, title, price, duration);
    servicesGrid.appendChild(card);
    const option = document.createElement("option");
    option.value = service.id;
    option.textContent = `${service.name} — ${money(service.price)}`;
    serviceSelect.appendChild(option);
  });
}
function renderAppointments(appointments) {
  appointmentsBody.innerHTML = "";
  if (!appointments.length) {
    appointmentsBody.innerHTML = '<tr><td colspan="7" class="empty">No appointments yet. Add your first booking above.</td></tr>';
  }
  appointments.forEach(appointment => {
    const row = document.createElement("tr");
    [appointment.customerName, appointment.phone, appointment.serviceName, appointment.date, appointment.time, money(appointment.price)].forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });
    const actionCell = document.createElement("td");
    const button = document.createElement("button");
    button.className = "delete-button";
    button.textContent = "Delete";
    button.addEventListener("click", async () => {
      if (!confirm(`Delete the appointment for ${appointment.customerName}?`)) return;
      try {
        await request(`${API}/appointments/${appointment.id}`, { method: "DELETE" });
        showMessage(dashboardMessage, "Appointment deleted.", "success");
        await loadAppointments();
      } catch (error) {
        showMessage(dashboardMessage, error.message, "error");
      }
    });
    actionCell.appendChild(button);
    row.appendChild(actionCell);
    appointmentsBody.appendChild(row);
  });
  document.getElementById("totalAppointments").textContent = appointments.length;
  document.getElementById("totalValue").textContent = money(appointments.reduce((sum, item) => sum + item.price, 0));
}
async function loadServices() {
  services = await request(`${API}/services`);
  renderServices();
}
async function loadAppointments() {
  const appointments = await request(`${API}/appointments`);
  renderAppointments(appointments);
}
bookingForm.addEventListener("submit", async event => {
  event.preventDefault();
  showMessage(formMessage, "Saving your booking…", "");
  const booking = {
    customerName: document.getElementById("customerName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    serviceId: Number(serviceSelect.value),
    date: document.getElementById("date").value,
    time: document.getElementById("time").value
  };
  try {
    const result = await request(`${API}/appointments`, { method: "POST", body: JSON.stringify(booking) });
    showMessage(formMessage, result.message, "success");
    bookingForm.reset();
    await loadAppointments();
  } catch (error) {
    showMessage(formMessage, error.message, "error");
  }
});
(async function init() {
  try {
    const dateInput = document.getElementById("date");
    const today = new Date();
    dateInput.min = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    await loadServices();
    await loadAppointments();
  } catch (error) {
    showMessage(formMessage, `Cannot connect to backend: ${error.message}. Make sure the server is running.`, "error");
  }
})();
