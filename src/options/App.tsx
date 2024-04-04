import React, { useState } from "react";

interface FormData {
  denyList: String;
}

export default function App() {
  const [formData, setFormData] = useState({});

  return (
    <>
      <form>
        <label>Deny List (regexp)</label>
        <br />
        <sub>
          One per line. Will be applied to filter out jobs' titles matching
          these.
        </sub>
        <br />
        <textarea
          id="deny-list"
          name="deny-list"
          rows={4}
          cols={50}
          placeholder=""
        ></textarea>

        <br />

        <label>Check for Visa Sponshorship?</label>
        <input
          id="check-for-visa-sponsorship"
          type="checkbox"
          name="check-for-visa-sponsorship"
        />

        <br />

        <label>Match Threshold</label>
        <input
          id="match-threshold"
          name="match-threshold"
          type="range"
          min="0"
          max="100"
          step="5"
          value={1}
        />

        <button type="submit">Save</button>
      </form>
    </>
  );
}
