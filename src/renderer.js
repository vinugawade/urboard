/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
const { ipcRenderer, clipboard } = require("electron")
const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")
const Swal = require("sweetalert2")
const $ = require("jquery")

function createItemTemplate(itemID, text) {
  return (
    `
  <div class="item text-3xl font-bold underline" itemID="` +
    itemID +
    `">
    <div class="text">
    ` +
    text +
    `
    </div>
    <button class="clipboard" itemID="` +
    itemID +
    `">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256"><path fill="#1c6ec1" d="M216 32H88a8 8 0 0 0-8 8v40H40a8 8 0 0 0-8 8v128a8 8 0 0 0 8 8h128a8 8 0 0 0 8-8v-40h40a8 8 0 0 0 8-8V40a8 8 0 0 0-8-8Zm-8 128h-32V88a8 8 0 0 0-8-8H96V48h112Z"/></svg>
    </button>
    <button class="delete" itemID="` +
    itemID +
    `">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 36 36"><path fill="red" d="M27.14 34H8.86A2.93 2.93 0 0 1 6 31V11.23h2V31a.93.93 0 0 0 .86 1h18.28a.93.93 0 0 0 .86-1V11.23h2V31a2.93 2.93 0 0 1-2.86 3Z" class="clr-i-outline clr-i-outline-path-1"/><path fill="red" d="M30.78 9H5a1 1 0 0 1 0-2h25.78a1 1 0 0 1 0 2Z" class="clr-i-outline clr-i-outline-path-2"/><path fill="red" d="M21 13h2v15h-2z" class="clr-i-outline clr-i-outline-path-3"/><path fill="red" d="M13 13h2v15h-2z" class="clr-i-outline clr-i-outline-path-4"/><path fill="red" d="M23 5.86h-1.9V4h-6.2v1.86H13V4a2 2 0 0 1 1.9-2h6.2A2 2 0 0 1 23 4Z" class="clr-i-outline clr-i-outline-path-5"/><path fill="none" d="M0 0h36v36H0z"/></svg>
    </button>
  </div>`
  )
}

ipcRenderer.on("update-clipboard", async event => {
  let text = await getLastItemDb()
  await writeLastItem(text[0])
})

let params = new URLSearchParams(global.location.search)
let filePath = decodeURIComponent(params.get('path'))

function getLastItemDb() {
  const adapter = new FileSync(
    filePath
  )
  const db = low(adapter)
  return (text = db
    .get("clipboard")
    .takeRight(1)
    .value())
}

$(function() {
  const adapter = new FileSync(
    filePath
  )
  const db = low(adapter)
  const items = db.get("clipboard").value()

  items.reverse()
  writeItems(items)
})

// $(".minimize").on("click", function() {
//   ipcRenderer.send("hide-window")
// })

$(".exit").on("click", function() {
  Swal.fire({
    title: "Are you sure?",
    text: "Application is closing. Are you sure you want to continue?",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Yes, Exit!",
    cancelButtonText: "Cancel"
  }).then(result => {
    if (result.value) {
      ipcRenderer.send("app-quit")
    }
  })
})

$(".delete-all").on("click", function() {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Delete Clipboard",
    cancelButtonText: "Cancel"
  }).then(result => {
    if (result.value) {
      const adapter = new FileSync(
        filePath
      )
      const db = low(adapter)
      db.get("clipboard")
        .remove()
        .write()
      clearDashboard()
    }
  })
})

$("#items").on("click", ".item button.delete", function() {
  itemID = $(this).attr("itemid")
  deleteItemClipboard(itemID)
})

$("#items").on("click", ".item button.clipboard", function() {
  itemID = $(this).attr("itemid")
  let text = $("#items div.item[itemid='" + itemID + "'] div.text").text()
  clipboard.writeText(text)
})

function deleteItemClipboard(itemID) {
  const adapter = new FileSync(
    filePath
  )
  const db = low(adapter)
  db.get("clipboard")
    .remove({ id: itemID })
    .write()

  $("div[itemid=" + itemID + "]").remove()
}

function writeItems(items) {
  items.forEach(element => {
    $("#items").append(createItemTemplate(element.id, element.text))
  })
}

function writeLastItem(item) {
  $("#items").prepend(createItemTemplate(item.id, item.text))
}

function clearDashboard() {
  $("#items").empty()
}