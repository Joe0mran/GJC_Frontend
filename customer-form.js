const API_BASE_URL = "https://gjc.somee.com";
// replace with your actual backend URL

const customerForm = document.getElementById("customerForm");
const resetBtn = document.getElementById("resetBtn");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");

const fields = {
  firstName: document.getElementById("firstName"),
  lastName: document.getElementById("lastName"),
  phoneNumber: document.getElementById("phoneNumber"),
  email: document.getElementById("email"),
  igAccount: document.getElementById("igAccount"),
  country: document.getElementById("country"),
  city: document.getElementById("city"),
  addressLine: document.getElementById("addressLine"),
  addressNotes: document.getElementById("addressNotes"),
  notes: document.getElementById("notes")
};

function setError(fieldName, message) {
  const errorElement = document.getElementById(`${fieldName}Error`);
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearErrors() {
  Object.keys(fields).forEach((key) => setError(key, ""));
}

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function clearMessage() {
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

function normalizeInstagram(value) {
  return value.trim().replace(/\s+/g, "");
}

function validateForm() {
  clearErrors();
  clearMessage();

  let isValid = true;

  const firstName = fields.firstName.value.trim();
  const lastName = fields.lastName.value.trim();
  const phoneNumber = fields.phoneNumber.value.trim();
  const email = fields.email.value.trim();
  const country = fields.country.value.trim();
  const city = fields.city.value.trim();
  const addressLine = fields.addressLine.value.trim();

  if (!firstName) {
    setError("firstName", "First name is required.");
    isValid = false;
  }

  if (!lastName) {
    setError("lastName", "Last name is required.");
    isValid = false;
  }

  if (!phoneNumber) {
    setError("phoneNumber", "Phone number is required.");
    isValid = false;
  } else if (phoneNumber.length < 7) {
    setError("phoneNumber", "Phone number is too short.");
    isValid = false;
  }

  if (email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("email", "Invalid email format.");
      isValid = false;
    }
  }

  if (!country) {
    setError("country", "Country is required.");
    isValid = false;
  }

  if (!city) {
    setError("city", "City is required.");
    isValid = false;
  }

  if (!addressLine) {
    setError("addressLine", "Address is required.");
    isValid = false;
  }

  return isValid;
}

function buildPayload() {
  return {
    firstName: fields.firstName.value.trim(),
    lastName: fields.lastName.value.trim(),
    phoneNumber: fields.phoneNumber.value.trim(),
    email: fields.email.value.trim() || null,
    igAccount: normalizeInstagram(fields.igAccount.value) || null,
    country: fields.country.value.trim(),
    city: fields.city.value.trim(),
    addressLine: fields.addressLine.value.trim(),
    addressNotes: fields.addressNotes.value.trim() || null,
    notes: fields.notes.value.trim() || null
  };
}

async function submitCustomer(payload) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  let responseData = null;

  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const errorMessage =
      responseData?.message ||
      responseData?.title ||
      "Failed to submit form.";
    throw new Error(errorMessage);
  }

  return responseData;
}

customerForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!validateForm()) return;

  const payload = buildPayload();

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    await submitCustomer(payload);
    showMessage("Your data has been submitted successfully.", "success");
    customerForm.reset();
  } catch (error) {
    showMessage(error.message || "Something went wrong.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

resetBtn.addEventListener("click", function () {
  customerForm.reset();
  clearErrors();
  clearMessage();
});