/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

const electron = require('electron')
const { app, ipcRenderer, clipboard } = require("electron")
const path = require("path")
const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")
const Swal = require("sweetalert2")

const $ = require("jquery")

function createItemTemplate(itemID, text) {
  return (
    `
  <div class="item" itemID="` +
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
      <span class="icon icon-clipboard"></span>
    </button>
    <button class="delete" itemID="` +
    itemID +
    `">
      <span class="icon icon-delete"></span>
    </button>
  </div>`
  )
}

ipcRenderer.on("update-clipboard", async event => {
  let text = await getLastItemDb()
  await writeLastItem(text[0])
})

let params = new URLSearchParams(global.location.search);
let filePath = decodeURIComponent(params.get('path'))
console.log(filePath);

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

$(".minimize").on("click", function() {
  ipcRenderer.send("hide-window")
})

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