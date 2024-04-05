import React, { useState } from "react";

enum FormField {
  denyList = "denyList",
}

interface FormData {
  [FormField.denyList]: string[] | undefined;
}

export default function App() {
  const [formData, setFormData] = useState<FormData>({} as FormData);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log(formData);
  };

  const handleChange = (key: string, value: any) => {
    setFormData({ ...formData, [key]: value });
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
          value={formData[FormField.denyList]?.join("\n")}
          onChange={(event) =>
            handleChange(FormField.denyList, event.target.value.split("\n"))
          }
        ></textarea>

        <br />

        <button type="submit">Save</button>
      </form>
    </>
  );
}
