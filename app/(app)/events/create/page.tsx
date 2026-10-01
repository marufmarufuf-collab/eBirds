import CreateEventForm from "./CreateEventForm";

export default function CreateEventPage() {
  return (
    <main className="px-5 py-10 max-w-2xl">
      <h1 className="display text-2xl mb-6">Create an event</h1>
      <CreateEventForm />
    </main>
  );
}
