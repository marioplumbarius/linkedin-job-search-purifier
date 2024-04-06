import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";

enum FormField {
  denyList = "denyList",
}

interface Options {
  [FormField.denyList]: string[];
}

const initialOptions = { [FormField.denyList]: [] };

export default function App() {
  const [options, setOptions] = useState<Options>(initialOptions);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState<string>();

  // Initializes the form with data from storage
  useEffect(() => {
    browser.storage.local.get("options").then((data) => {
      if (data.options) setOptions(data.options);
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await browser.storage.local.set({ options });
    setNotification("saved!");
    setShowNotification(true);
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOptions(initialOptions);
  };

  return (
    <>
      <form onSubmit={handleSubmit} onReset={handleReset}>
        <label>Deny List (regexp)</label>
        <br />
        <sub>
          One per line. Will be applied to filter out jobs' titles matching
          these.
        </sub>
        <br />
        <textarea
          id={FormField.denyList}
          name={FormField.denyList}
          rows={4}
          cols={50}
          value={options[FormField.denyList].join("\n")}
          onChange={(event) => {
            setOptions({
              ...options,
              [FormField.denyList]: event.target.value.split("\n"),
            });
          }}
        />

        <br />

        <Button variant="contained" color="primary" type="submit">
          Save
        </Button>

        <Button variant="outlined" color="secondary" type="reset">
          Clear
        </Button>

        <Snackbar
          open={showNotification}
          autoHideDuration={1000}
          onClose={() => setShowNotification(false)}
          message={notification}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        />
      </form>
    </>
  );
}
