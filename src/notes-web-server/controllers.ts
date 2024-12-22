import { Request, Response } from "express";
import { NoteSchema, Note } from "./schemas.js";
import { getAllNotes, createOrUpdateNote, deleteNote } from "./services.js";

export const renderHomePage = async (_req: Request, res: Response) => {
  try {
    const notes = await getAllNotes();
    const header = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Notes App</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100">
      <div class="container mx-auto p-4">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">Notes</h1>
          <button id="createBtn" class="px-4 py-2 bg-blue-500 text-white rounded">Create Note</button>
        </div>
        <div id="notesList">
    `;

    const footer = `
        </div>
      </div>

      <!-- Native Modal -->
      <dialog id="modal" class="p-4 rounded bg-white w-1/2">

        <form method="POST" action="/notes" class="flex flex-col space-y-4">
          <h2 id="modalTitle" class="text-xl font-semibold">Create Note</h2>
          <input type="text" name="id" id="id" placeholder="Id" required class="border p-2 rounded">
          <input type="text" name="title" id="title" placeholder="Title" required class="border p-2 rounded">
          <input type="text" name="summary" id="summary" placeholder="Summary" required class="border p-2 rounded">
          <input type="text" name="tags" id="tags" placeholder="Tags (comma separated)" class="border p-2 rounded">
          <textarea name="content" id="content" rows="25" placeholder="Content" required class="border p-2 rounded"></textarea>
          <div class="flex justify-end space-x-2">
            <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded">Save</button>
            <button type="button" id="cancelBtn" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          </div>
        </form>
      </dialog>

      <script>
        const createBtn = document.getElementById('createBtn');
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const cancelBtn = document.getElementById('cancelBtn');

        createBtn.addEventListener('click', () => {
          modalTitle.textContent = 'Create Note';
          document.getElementById('id').value = '';
          document.getElementById('title').value = '';
          document.getElementById('summary').value = '';
          document.getElementById('tags').value = '';
          document.getElementById('content').value = '';
          modal.showModal();
        });

        cancelBtn.addEventListener('click', () => {
          modal.close();
        });

        function openEditModal(note) {
          modalTitle.textContent = 'Edit Note';
          document.getElementById('id').value = note.id;
          document.getElementById('title').value = note.title;
          document.getElementById('summary').value = note.summary;
          document.getElementById('tags').value = note.tags.join(',');
          document.getElementById('content').value = note.content;
          modal.showModal();
        }

        function confirmDelete(id) {
          if (confirm('Are you sure you want to delete this note?')) {
            fetch('/notes/' + id, { method: 'DELETE' })
              .then(() => location.reload());
          }
        }
      </script>
    </body>
    </html>
    `;

    const notesHtml = notes
      .map(
        (note) => `
      <div class="bg-white p-4 rounded shadow mb-2">
        <h2 class="text-xl font-sembold">${note.title}</h2>
        <p class="text-gray-600">${note.summary}</p>
        <div class="mt-2">
          <button onclick='openEditModal(${JSON.stringify(
            note
          )})' class="px-3 py-1 bg-yellow-500 text-white rounded mr-2">Edit</button>
          <button onclick="confirmDelete('${
            note.id
          }')" class="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
        </div>
      </div>
    `
      )
      .join("");

    res.send(header + notesHtml + footer);
  } catch (error) {
    console.error("Error rendering home page:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const createOrUpdateNoteHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (typeof req.body.tags === "string") {
      req.body.tags =
        req.body.tags.trim() === ""
          ? []
          : req.body.tags.split(",").map((tag: string) => tag.trim());
    }

    const result = NoteSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).send("Invalid data");
      return;
    }

    const note: Note = result.data;
    await createOrUpdateNote(note);
    res.redirect("/");
  } catch (error) {
    console.error("Error creating/updating note:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const deleteNoteHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteNote(id);
    res.status(200).send("Deleted");
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).send("Internal Server Error");
  }
};
