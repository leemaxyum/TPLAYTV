import { hubTracks } from "./catalog";

const errors = hubTracks.flatMap((track) => {
  const messages: string[] = [];
  if (track.topicCount !== track.topics.length) {
    messages.push(`${track.title}: says ${track.topicCount} topics but contains ${track.topics.length}.`);
  }
  const ids = track.topics.map((topic) => topic.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) messages.push(`${track.title}: duplicate lesson IDs: ${[...new Set(duplicates)].join(", ")}.`);
  return messages;
});

if (errors.length) throw new Error(`Hub Learn catalog check failed:\n${errors.join("\n")}`);

const lessonCount = hubTracks.reduce((total, track) => total + track.topics.length, 0);
console.log(`Hub Learn catalog valid: ${hubTracks.length} tracks, ${lessonCount} authored lessons.`);

