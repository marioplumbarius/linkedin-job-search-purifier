import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { DefaultExtensionOptions, ExtensionOptions } from "../dto";

enum FormField {
  titleDenyList = "titleDenyList",
  companyDenyList = "companyDenyList",
  googleApiKey = "googleApiKey",
}

export default function Options() {
  const [options, setOptions] = useState<ExtensionOptions>(
    DefaultExtensionOptions,
  );
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

    // This protects readers of the local storage from processing an empty string as
    // a valid regexp. Unfortunately when the input is empty, it's still stored as an array with a single empty string. This fixes that by converting back to an empty array.
    if (options.denyList.titles[0] === "") options.denyList.titles = [];
    if (options.denyList.companies[0] === "") options.denyList.companies = [];

    await browser.storage.local.set({ options });
    setNotification("saved!");
    setShowNotification(true);
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOptions(DefaultExtensionOptions);
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
        <br />

        <label>Companies to Exclude (regexp)</label>
        <br />
        <sub>One per line.</sub>
        <br />
        <textarea
          id={FormField.companyDenyList}
          name={FormField.companyDenyList}
          rows={4}
          cols={50}
          value={options.denyList.companies.join("\n")}
          onChange={(event) => {
            setOptions({
              ...options,
              denyList: {
                ...options.denyList,
                companies: event.target.value.split("\n"),
              },
            });
          }}
        />

        <br />
        <br />

        <label>Google API Key</label>
        <br />
        <input
          id={FormField.googleApiKey}
          name={FormField.googleApiKey}
          value={options.googleApiKey}
          type="password"
          onChange={(event) => {
            setOptions({
              ...options,
              googleApiKey: event.target.value,
            });
          }}
        />

        <br />
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
