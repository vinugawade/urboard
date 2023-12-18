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

function createItems(clipId, text) {
  return (
    `<div class="item flex cursor-pointer space-x-8 rounded-lg border-1 border-transparent bg-sky-200 p-2 transition-all hover:scale-105 hover:border-white shadow-lg shadow-sky-600 hover:shadow-sky-400" clipId="${clipId}"><div class="flex w-[50px] flex-1">
    <xmp class="text-xs select-all m-0 w-full overflow-hidden text-ellipsis whitespace-nowrap rounded font-sans font-normal tracking-normal text-black transition-all hover:text-gray-800">
    ${text}
    </xmp>
    <div class="flex w-28 items-center justify-between ps-10">
      <button class="copy-to-clipboard" clipId="${clipId}">
      <svg class="h-4 w-4 overflow-hidden transition-all hover:scale-125" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256">
        <path class="h-4 w-4 transition-all fill-sky-500 hover:fill-sky-600" d="M216 32H88a8 8 0 0 0-8 8v40H40a8 8 0 0 0-8 8v128a8 8 0 0 0 8 8h128a8 8 0 0 0 8-8v-40h40a8 8 0 0 0 8-8V40a8 8 0 0 0-8-8Zm-8 128h-32V88a8 8 0 0 0-8-8H96V48h112Z"></path>
      </svg>
      </button>
      <button class="delete" clipId="${clipId}">
        <svg class="h-4 w-4 overflow-hidden transition-all hover:scale-125" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 36 36">
        <path fill="red" d="M27.14 34H8.86A2.93 2.93 0 0 1 6 31V11.23h2V31a.93.93 0 0 0 .86 1h18.28a.93.93 0 0 0 .86-1V11.23h2V31a2.93 2.93 0 0 1-2.86 3Z" class="clr-i-outline clr-i-outline-path-1"></path>
        <path fill="red" d="M30.78 9H5a1 1 0 0 1 0-2h25.78a1 1 0 0 1 0 2Z" class="clr-i-outline clr-i-outline-path-2"></path>
        <path fill="red" d="M21 13h2v15h-2z" class="clr-i-outline clr-i-outline-path-3"></path>
        <path fill="red" d="M13 13h2v15h-2z" class="clr-i-outline clr-i-outline-path-4"></path>
        <path fill="red" d="M23 5.86h-1.9V4h-6.2v1.86H13V4a2 2 0 0 1 1.9-2h6.2A2 2 0 0 1 23 4Z" class="clr-i-outline clr-i-outline-path-5"></path>
        <path fill="none" d="M0 0h36v36H0z"></path>
        </svg>
      </button>
      </div>
    </div>
  </div>`
  );
}

ipcRenderer.on("update-clipboard", async () => {
  let text = await getLastItemDb()
  await writeLastItem(text[0])
})

let params = new URLSearchParams(global.location.search)
let filePath = decodeURIComponent(params.get('path'))

function getLastItemDb() {
  const adapter = new FileSync(filePath)
  const db = low(adapter)
  return (text = db
    .get("clipboard")
    .takeRight(1)
    .value())
}

$(() => {
  const adapter = new FileSync(filePath)
  const db = low(adapter)
  const items = db.get("clipboard").value()

  items.reverse()
  writeItems(items)
})

$("button#minimize-btn").on("click", () => {
  ipcRenderer.send("hide-window")
})

// $(".exit").on("click", () => {
//   Swal.fire({
//     title: "Are you sure?",
//     text: "Application is closing. Are you sure you want to continue?",
//     showCancelButton: true,
//     confirmButtonColor: "#d33",
//     cancelButtonColor: "#aaa",
//     confirmButtonText: "Yes, Exit!",
//     cancelButtonText: "Cancel"
//   }).then(result => {
//     if (result.value) {
//       ipcRenderer.send("app-quit")
//     }
//   })
// })

$("button#delete-all").on("click", () => {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Yes",
    cancelButtonText: "No"
  }).then(result => {
    if (result.value) {
      const adapter = new FileSync(filePath)
      const db = low(adapter)
      db.get("clipboard")
        .remove()
        .write()

      db.defaults({ clipboard: [] }).write()
      clearDashboard()
    }
  })
})

$("#clips").on("click", ".item button.delete", function () {
  clipId = $(this).attr("clipId")
  deleteClipboardItem(clipId)
})

$("#clips").on("click", ".item button.copy-to-clipboard", function () {
  let clipId = $(this).attr("clipId")
  let text = $("#clips div.item[clipId='" + clipId + "'] xmp.select-all").text()
  const trimmedText = text.trim()
  clipboard.writeText(trimmedText)

  // Show Toast.
  Swal.fire({
    position: "top-end",
    toast: true,
    icon: "success",
    title: "Text Copied",
    showConfirmButton: false,
    timer: 1300,
    width: "13rem",
    padding: ".5rem",
    timerProgressBar: true
  })
})

$("button#info-btn").on("click", () => {
  // Show Toast.
  Swal.fire({
    confirmButtonColor: "#d33",
    html: `<div id="info-card" class="text-center">
    <div class="px-6 py-4 mx-auto text-center">
      <div class="font-light text-xl mb-2">Build with &#x1F499; by</div>
      <div class="font-bold font-kalam text-xl mb-2">Vinay Gawade</div>
      <p class="text-gray-700 text-base">
        Full Stack Developer
      </p>
    </div>
    <div class="px-6 pt-4 pb-2 text-center flex flex-row justify-evenly">
      <a href="https://github.com/vinugawade">
        <svg class="transition-all hover:scale-125" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
          viewBox="0 0 20 20">
          <path fill="currentColor"
            d="M20 10.25c0 2.234-.636 4.243-1.908 6.027c-1.271 1.784-2.914 3.018-4.928 3.703c-.234.045-.406.014-.514-.093a.539.539 0 0 1-.163-.4V16.67c0-.863-.226-1.495-.677-1.895a8.72 8.72 0 0 0 1.335-.24c.394-.107.802-.28 1.223-.52a3.66 3.66 0 0 0 1.055-.888c.282-.352.512-.819.69-1.402c.178-.583.267-1.252.267-2.008c0-1.077-.343-1.994-1.028-2.75c.32-.81.286-1.717-.105-2.723c-.243-.08-.594-.03-1.054.147a6.94 6.94 0 0 0-1.198.587l-.495.32a9.03 9.03 0 0 0-2.5-.346a9.03 9.03 0 0 0-2.5.347a11.52 11.52 0 0 0-.553-.36c-.23-.143-.593-.314-1.088-.514c-.494-.2-.868-.26-1.12-.18c-.381 1.005-.412 1.912-.09 2.722c-.686.756-1.03 1.673-1.03 2.75c0 .756.09 1.423.268 2.002c.178.578.406 1.045.683 1.401a3.53 3.53 0 0 0 1.048.894c.421.24.83.414 1.224.52c.395.108.84.188 1.335.241c-.347.32-.56.779-.638 1.375a2.539 2.539 0 0 1-.586.2a3.597 3.597 0 0 1-.742.067c-.287 0-.57-.096-.853-.287c-.282-.192-.523-.47-.723-.834a2.133 2.133 0 0 0-.631-.694c-.256-.178-.471-.285-.645-.32l-.26-.04c-.182 0-.308.02-.378.06c-.07.04-.09.09-.065.153a.738.738 0 0 0 .117.187a.961.961 0 0 0 .17.16l.09.066c.192.09.38.259.567.508c.187.249.324.476.41.68l.13.307c.113.338.304.612.574.821c.269.21.56.343.872.4c.312.058.614.09.905.094c.29.004.532-.011.723-.047l.299-.053c0 .338.002.734.007 1.188l.006.72c0 .16-.056.294-.17.4c-.112.108-.286.139-.52.094c-2.014-.685-3.657-1.92-4.928-3.703C.636 14.493 0 12.484 0 10.25c0-1.86.447-3.574 1.341-5.145a10.083 10.083 0 0 1 3.64-3.73A9.6 9.6 0 0 1 10 0a9.6 9.6 0 0 1 5.02 1.375a10.083 10.083 0 0 1 3.639 3.73C19.553 6.675 20 8.391 20 10.25" />
        </svg>
      </a>
      <a href="https://twitter.com/VinuGawade">
        <svg class="transition-all hover:scale-125" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
          viewBox="0 0 128 128">
          <path
            d="M75.916 54.2L122.542 0h-11.05L71.008 47.06L38.672 0H1.376l48.898 71.164L1.376 128h11.05L55.18 78.303L89.328 128h37.296L75.913 54.2ZM60.782 71.79l-4.955-7.086l-39.42-56.386h16.972L65.19 53.824l4.954 7.086l41.353 59.15h-16.97L60.782 71.793Z" />
        </svg>
      </a>
      <a href="https://www.linkedin.com/in/vinu-gawade">
        <svg class="transition-all hover:scale-125" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
          viewBox="0 0 32 32">
          <path fill="currentColor"
            d="M27.26 27.271h-4.733v-7.427c0-1.771-.037-4.047-2.475-4.047c-2.468 0-2.844 1.921-2.844 3.916v7.557h-4.739V11.999h4.552v2.083h.061c.636-1.203 2.183-2.468 4.491-2.468c4.801 0 5.692 3.161 5.692 7.271v8.385zM7.115 9.912a2.75 2.75 0 0 1-2.751-2.756a2.753 2.753 0 1 1 2.751 2.756m2.374 17.359H4.74V12h4.749zM29.636 0H2.36C1.057 0 0 1.031 0 2.307v27.387c0 1.276 1.057 2.307 2.36 2.307h27.271c1.301 0 2.369-1.031 2.369-2.307V2.307C32 1.031 30.932 0 29.631 0z" />
        </svg>
      </a>
      <a href="mailto:vinulike11@gmail.com">
        <svg class="transition-all hover:scale-125" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
          viewBox="0 0 16 16">
          <path fill="currentColor"
            d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2M1.5 12.251c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.809L8.38 9.397a.75.75 0 0 1-.76 0L1.5 5.809zm13-8.181v-.32a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25v.32L8 7.88Z" />
        </svg>
      </a>
      <a href="https://vinux.in">
        <svg class="transition-all hover:scale-125" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
          viewBox="0 0 24 24">
          <g fill="currentColor">
            <path fill-rule="evenodd" d="M14 7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zm3 2h-2v6h2z"
              clip-rule="evenodd" />
            <path
              d="M6 7a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2zm0 4a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2zm-1 5a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1" />
            <path fill-rule="evenodd"
              d="M4 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm16 2H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1"
              clip-rule="evenodd" />
          </g>
        </svg>
      </a>
    </div>
    <div class="px-6 pt-4 pb-2 text-center font-bold">
      <div
        class="py-3 flex items-center text-sm text-gray-800 before:flex-[1_1_0%] before:border-t before:me-6 after:flex-[1_1_0%] after:border-t after:border-sky-500 after:ms-6 before:border-sky-500">
        App Info</div>

      <table class="w-full border-collapse text-xs font-normal mt-3">
        <thead>
          <tr>
            <th class="w-40 min-w-[10rem] max-w-[10rem] leading-normal">
              <svg class="inline-block" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
                <path fill="currentColor" fill-rule="evenodd"
                  d="M3 4h10a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 13 12H3a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 3 4M0 5.5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3zm6.25 3.25a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5zM4.5 6.5a1 1 0 1 1-2 0a1 1 0 0 1 2 0m2 1a1 1 0 1 0 0-2a1 1 0 0 0 0 2m4-1a1 1 0 1 1-2 0a1 1 0 0 1 2 0m2 1a1 1 0 1 0 0-2a1 1 0 0 0 0 2m-8 2a1 1 0 1 1-2 0a1 1 0 0 1 2 0m8 1a1 1 0 1 0 0-2a1 1 0 0 0 0 2"
                  clip-rule="evenodd" />
              </svg>&nbsp;&nbsp;Shortcuts
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="h-12">Show/Hide Clipboard <svg class="inline" mlns="http://www.w3.org/2000/svg" width="18"
                height="18" viewBox="0 0 24 24">
                <g fill="none">
                  <path
                    d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                  <path fill="currentColor"
                    d="M21 13v7.434a1.5 1.5 0 0 1-1.553 1.499l-.133-.011L12 21.008V13zm-11 0v7.758l-5.248-.656A2 2 0 0 1 3 18.117V13zm9.314-10.922a1.5 1.5 0 0 1 1.68 1.355l.006.133V11h-9V2.992zM10 3.242V11H3V5.883a2 2 0 0 1 1.752-1.985z" />
                </g>
              </svg> / <svg class="inline" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                viewBox="0 0 2048 2048">
                <path fill="currentColor"
                  d="M1700 1428q32 14 48 38t23 58q4 20 9 37t12 32t16 29t24 31q13 14 23 36t10 42q0 23-12 39t-30 28q-23 16-48 28t-50 25q-41 20-71 42t-60 56q-16 18-36 35t-44 32t-49 22t-50 9q-58 0-96-20t-66-73q-8-15-16-19t-26-7q-51-4-101-8t-102-4q-42 0-86 7t-87 17q-9 2-18 15t-25 29t-43 28t-71 13q-33 0-71-7t-68-23q-62-31-122-42t-127-20q-23-3-44-8t-37-17t-25-28t-10-45q0-31 8-60t9-61q0-22-3-43t-4-45q0-51 24-75t70-38q22-7 38-19t30-26t26-31t27-34q3-4 3-9q0-12-1-23t-2-24q0-68 21-137t55-135t76-127t83-113q58-74 87-154t30-174q0-40-4-79t-4-80q0-80 18-144t56-110t99-69t146-25q101 0 161 40t92 105t41 145t10 162v17q0 41 1 73t8 63t21 62t42 67q48 63 98 127t91 132t67 142t27 160q0 69-21 133M861 386q14 0 23 7t14 19t7 24t2 25q0 10-3 16t-9 11t-12 10t-12 12q-7 11-19 18t-23 15t-20 17t-9 25q0 9 9 15q24 16 34 39t22 45t31 37t59 15h6q40-2 76-21t72-40q5-3 13-6t13-7l73-57q2-7 3-13t2-14q0-11-5-18t-12-12t-17-7t-18-5q-24-5-45-18t-44-20q-4-1-6-6t-4-12t-1-13t-1-10q0-12 2-25t9-25t16-18t26-7q31 0 45 23t15 50q0 13-5 23t-5 22q0 8 5 11t13 4q23 0 30-11t8-33q0-23-4-51t-16-52t-31-40t-49-16q-52 0-75 26t-24 78q0 15 2 30t2 30q0 5-1 5t-6-2t-12-5t-15-5t-16-2q-2 0-10 1t-16 1q-14 0-14-5q0-15-2-38t-10-46t-20-38t-36-16q-17 0-29 11t-21 26t-11 34t-4 32q0 6 2 21t7 31t11 28t14 12q5 0 13-7t8-13q0-3-3-4t-6-1q-7 0-12-7t-8-16t-6-19t-2-15q0-20 9-36t33-17M643 1943q24 0 47-4t43-16t30-31t12-48q0-18-6-35t-17-32q-12-19-26-36t-26-36q-19-28-37-55t-36-57q-16-26-30-52t-34-51q-12-15-28-27t-37-12q-22 0-38 14t-33 34t-38 39t-54 30q-26 8-40 22t-14 43q0 20 3 40t4 40q0 27-8 51t-8 47q0 27 19 38t43 15q30 5 57 8t53 9t52 13t55 22q6 3 18 7t27 9t28 8t19 3m366-120q28 0 60-6t64-17t61-26t52-33q2-2 4-6t3-8v-1q6-22 10-48t7-53t7-53t7-51q4-27 10-52t16-47t27-39t44-32v-2l-1-3q0-9 6-19t15-21t19-17t21-10q-6-24-13-48t-12-48q-6-36-12-61t-14-46t-23-41t-37-48q-11-13-15-20t-6-25q-1-7-6-26t-13-44t-18-52t-22-49t-22-37t-21-15q-24 0-57 19t-70 42t-72 43t-63 19q-30 0-55-19t-46-44t-35-43t-21-20q-8 0-9 12t-1 27v17q0 6-2 8q-11 23-24 45t-26 45t-20 47t-8 50q0 15 2 30t10 29l-2 4q-8 11-17 20t-17 21q-37 55-52 119t-16 130q0 17 2 34t2 34q0 5-1 11t-1 11q17 1 40 14t50 33t51 46t46 51t32 50t13 41q0 26-16 42t-40 26q17 30 42 51t54 34t63 19t66 6m401 142q21 0 41-6q31-9 57-26t48-42q27-31 57-54t68-42q17-8 33-15t33-17q11-7 21-17t10-24q0-8-3-15t-9-15q-15-21-26-39t-19-38t-16-40t-14-45q-1-5-7-13q-21-30-59-30q-18 0-34 9t-34 19t-36 19t-38 9q-20 0-33-10t-22-27t-15-33t-12-33q-8 13-18 24t-16 26q-13 30-16 67q-5 58-13 113t-27 110q-5 16-8 35t-4 37q0 49 30 81t81 32" />
              </svg> / <svg class="inline" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                <g fill="none" stroke="currentColor" stroke-width="1.5">
                  <path
                    d="M16 2c.363 2.18-1.912 3.83-3.184 4.571c-.375.219-.799-.06-.734-.489C12.299 4.64 13.094 2 16 2Z" />
                  <path
                    d="M9 6.5c.897 0 1.69.2 2.294.42a3.58 3.58 0 0 0 2.412 0A6.73 6.73 0 0 1 16 6.5c1.085 0 2.465.589 3.5 1.767C16 11 17 15.5 20.269 16.692c-1.044 2.867-3.028 4.808-4.77 4.808c-1.5 0-1.499-.7-2.999-.7s-1.5.7-3 .7c-2.5 0-5.5-4-5.5-9c0-4 3-6 5-6Z" />
                </g>
              </svg></td>
          </tr>
          <tr>
            <td class="h-6">
              <svg class="inline" mlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                <g fill="none">
                  <path
                    d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                  <path fill="currentColor"
                    d="M21 13v7.434a1.5 1.5 0 0 1-1.553 1.499l-.133-.011L12 21.008V13zm-11 0v7.758l-5.248-.656A2 2 0 0 1 3 18.117V13zm9.314-10.922a1.5 1.5 0 0 1 1.68 1.355l.006.133V11h-9V2.992zM10 3.242V11H3V5.883a2 2 0 0 1 1.752-1.985z" />
                </g>
              </svg> Or <svg class="inline" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                viewBox="0 0 256 256">
                <path fill="currentColor"
                  d="M100 86.38V100H86.38A14.25 14.25 0 0 1 72 87a14 14 0 0 1 15-15a14.25 14.25 0 0 1 13 14.38M72 169a14 14 0 0 0 15 15a14.25 14.25 0 0 0 13-14.34V156H86.38A14.25 14.25 0 0 0 72 169m112-82a14 14 0 0 0-15-15a14.25 14.25 0 0 0-13 14.34V100h13.62A14.25 14.25 0 0 0 184 87m40-23v128a32 32 0 0 1-32 32H64a32 32 0 0 1-32-32V64a32 32 0 0 1 32-32h128a32 32 0 0 1 32 32m-68 76v-24h13.38c16.39 0 30.21-12.88 30.61-29.25A30 30 0 0 0 169.25 56C152.88 56.41 140 70.23 140 86.62V100h-24V86.62c0-16.39-12.88-30.21-29.25-30.62A30 30 0 0 0 56 86.75C56.41 103.12 70.23 116 86.62 116H100v24H86.62c-16.39 0-30.21 12.88-30.62 29.25A30 30 0 0 0 86.75 200c16.37-.4 29.25-14.22 29.25-30.61V156h24v13.38c0 16.39 12.88 30.21 29.25 30.61A30 30 0 0 0 200 169.25c-.4-16.37-14.22-29.25-30.61-29.25Zm-40 0h24v-24h-24Zm40 30a14 14 0 1 0 14-14h-14Z" />
              </svg>&nbsp;&nbsp;+&nbsp;&nbsp;<svg class="inline" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                viewBox="0 0 24 24">
                <path fill="currentColor"
                  d="M13.321 2.603a1.75 1.75 0 0 0-2.644 0l-8.245 9.504c-.983 1.133-.178 2.897 1.322 2.897H7v2.246c0 .966.783 1.75 1.75 1.75h6.5A1.75 1.75 0 0 0 17 17.25v-2.246h3.245c1.5 0 2.305-1.764 1.322-2.897zm-1.51.983a.25.25 0 0 1 .377 0l8.245 9.504a.25.25 0 0 1-.188.414H16.25a.75.75 0 0 0-.75.75v2.996a.25.25 0 0 1-.25.25h-6.5a.25.25 0 0 1-.25-.25v-2.996a.75.75 0 0 0-.75-.75H3.754a.25.25 0 0 1-.189-.414zM7.75 20.5a.75.75 0 1 0 0 1.5h8.5a.75.75 0 0 0 0-1.5z" />
              </svg>&nbsp;&nbsp;+&nbsp;&nbsp;<span class="font-bold text-md">X</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`,
  })
})

function deleteClipboardItem(clipId) {
  const adapter = new FileSync(filePath)
  const db = low(adapter)
  db.get("clipboard")
    .remove({ id: clipId })
    .write()

  $("div[clipId=" + clipId + "]").remove()

  // Show Toast.
  Swal.fire({
    position: "top-end",
    toast: true,
    icon: "info",
    title: "Text Deleted",
    showConfirmButton: false,
    timer: 1300,
    width: "14rem",
    padding: ".5rem",
    timerProgressBar: true
  })
}

function writeItems(items) {
  items.forEach(element => {
    $("#clips").append(createItems(element.id, element.text))
  })
}

function writeLastItem(item) {
  $("#clips").prepend(createItems(item.id, item.text))
}

function clearDashboard() {
  $("#clips").empty()
}

// Search in clipboard.
$("#search-q").on("keyup", function () {
  var value = this.value.toLowerCase().trim()
  filterItems(value)
})

$("#search-q").on("input", () => {
  var value = $("#search-q").val().toLowerCase().trim()
  if (value === "") {
    filterItems("")
  }
})

function filterItems(value) {
  $("#clips div.item").each(function () {
    var $this = $(this)
    if ($this.text().toLowerCase().trim().indexOf(value) === -1) {
      $this.hide()
    } else {
      $this.show()
    }
  })
}