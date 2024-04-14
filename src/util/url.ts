export function getJobIdFromURL(): number | undefined {
  const jobId = new URLSearchParams(window.location.search).get("currentJobId");
  if (jobId) return parseInt(jobId);
  return undefined;
}
