import ModalOverlay from "@/components/ModalOverlay";
import CreateEventForm from "../../../events/create/CreateEventForm";

// Intercepted: clicking "+ Create event" from within the app renders this
// as a pop-up instead of navigating away. A direct link or refresh still
// gets the real full page.
export default function CreateEventModal() {
  return (
    <ModalOverlay maxWidth="max-w-xl">
      <h1 className="display text-xl mb-4 px-1">Create an event</h1>
      <CreateEventForm />
    </ModalOverlay>
  );
}
