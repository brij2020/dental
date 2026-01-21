import React from 'react';
import './ParentalConsentForm.css';

export default function ParentalConsentForm() {
  return (
    <div className="form-container">
      <h2 className="form-title">Parental Consent & Medical Information Form</h2>
      <form>
        <div className="form-group grid">
          <div>
            <label>Parent / Guardian First Name</label>
            <input type="text" name="parentFirstName" required />
          </div>
          <div>
            <label>Last Name</label>
            <input type="text" name="parentLastName" required />
          </div>
        </div>
        <div className="form-group grid">
          <div>
            <label>Child First Name</label>
            <input type="text" name="childFirstName" required />
          </div>
          <div>
            <label>Last Name</label>
            <input type="text" name="childLastName" required />
          </div>
        </div>
        <div className="form-group grid">
          <div>
            <label>Date of Birth</label>
            <input type="date" name="dob" required />
          </div>
          <div>
            <label>Phone Number</label>
            <input type="tel" name="phone" placeholder="(Area Code) Phone Number" required />
          </div>
        </div>
        <div className="form-group grid">
          <div>
            <label>Street Address</label>
            <input type="text" name="address1" required />
          </div>
          <div>
            <label>Address Line 2</label>
            <input type="text" name="address2" />
          </div>
        </div>
        <div className="form-group grid">
          <div>
            <label>City</label>
            <input type="text" name="city" required />
          </div>
          <div>
            <label>State</label>
            <input type="text" name="state" required />
          </div>
          <div>
            <label>ZIP Code</label>
            <input type="text" name="zip" required />
          </div>
        </div>
        <div className="statement">
          I affirm that I have been completely informed of the sport activities that
          my child will participate in. I understand the general structure of the
          sport activities/programs and do not need to be informed of each activity.
        </div>
        <h3 className="section-title">Medical Conditions (check all that apply)</h3>
        <div className="checkbox-group">
          <label><input type="checkbox" name="measles" /> Measles</label>
          <label><input type="checkbox" name="mumps" /> Mumps</label>
          <label><input type="checkbox" name="asthma" /> Asthma</label>
          <label><input type="checkbox" name="sinusitis" /> Sinusitis</label>
          <label><input type="checkbox" name="bronchitis" /> Bronchitis</label>
          <label><input type="checkbox" name="diabetes" /> Diabetes</label>
          <label><input type="checkbox" name="heartTrouble" /> Heart Trouble</label>
        </div>
        <div className="statement">
          I hereby voluntarily release, forever discharge the community, corporation,
          its officers, directors, employees, volunteers, and agents from any and all
          claims connected with my child's participation in the programs or use of
          equipment and facilities.
        </div>
        <div className="form-actions">
          <button type="submit" className="submit-btn">Submit</button>
        </div>
      </form>
    </div>
  );
}
