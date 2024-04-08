import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { ExtensionOptions } from "../dto";

enum FormField {
  titleDenyList = "titleDenyList",
}

const initialOptions: ExtensionOptions = {
  denyList: { titles: [] },
};

export default function App() {
  const [options, setOptions] = useState<ExtensionOptions>(initialOptions);
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
        <label>Job Titles to Exclude (regexp)</label>
        <br />
        <sub>One per line.</sub>
        <br />
        <textarea
          id={FormField.titleDenyList}
          name={FormField.titleDenyList}
          rows={4}
          cols={50}
          value={options.denyList.titles.join("\n")}
          onChange={(event) => {
            setOptions({
              ...options,
              denyList: {
                ...options.denyList,
                titles: event.target.value.split("\n"),
              },
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
