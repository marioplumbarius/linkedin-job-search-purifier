import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

enum FormField {
  denyList = "denyList",
}

interface Options {
  [FormField.denyList]: string[];
}

const initialOptions = { [FormField.denyList]: [] };

export default function App() {
  const [options, setOptions] = useState<Options>(initialOptions);

  // Initializes the form with data from storage
  useEffect(() => {
    browser.storage.local.get("options").then((data) => {
      if (data.options) setOptions(data.options);
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await browser.storage.local.set({ options });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
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
        ></textarea>

        <br />

        <button type="submit">Save</button>
      </form>
    </>
  );
}
