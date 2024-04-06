export class LinkedinUrnMapper {
  mapEntityUrnToJobPostingId(urn: string): string {
    try {
      return urn.split(":").at(-1)!.split(",").at(0)!.replace("(", "");
    } catch (error) {
      throw new Error(
        `Unable to map entity urn ${urn} to job posting id. Error: ${error}`,
      );
    }
  }

  mapTrackingUrnToJobPostingId(urn: string): string {
    try {
      return urn.split(":").at(-1)!;
    } catch (error) {
      throw new Error(
        `Unable to map tracking urn ${urn} to job posting id. Error: ${error}`,
      );
    }
  }
}
