
function generateUhid(prefix = "UHID") {
  // Get current year
  const year = new Date().getFullYear();

  // Increment sequence (in real use, fetch last sequence from DB)
  counter += 1;
  const sequence = String(counter).padStart(4, "0"); // e.g., 0001, 0002

  // Final UHID format: UHIDYYYY#### 
  return `${prefix}${year}${sequence}`;
}

module.exports = generateUhid;
