const constants = require('../shared/constants')

/*
 * Download the result of pdfextract.jar.
 */
import * as annoUI from 'anno-ui'
import { parseUrlQuery } from '../shared/util'

/*
 * Setup the function.
 */
export function setup () {
  reset()
  setupExportAnnoButton()
  window.addEventListener('didCloseViewer', disable)
  window.addEventListener('willChangeContent', disable)
  window.addEventListener('didChangeContent', enable)
}

/*
 * Reset events.
 */
function reset () {
  $('#exportAnnoButton').off('click')
  window.removeEventListener('didCloseViewer', disable)
  window.removeEventListener('willChangeContent', disable)
  window.removeEventListener('didChangeContent', enable)
}

/*
 * Setup the download button.
 */
function setupExportAnnoButton () {

  // $('#exportAnnoButton').on('click', e => {
  $('#exportAnnoButton').off().on('click', async () => {

    // TODO 実装する.
    // userIdがない状態でボタンを押したら、エラー表示.
    // Logタブにも表示.

    // Get current annotations.
    const anno = await window.annoPage.exportData({ exportType : 'json' })

    // Upload.
    const err = await uploadAnnotation(anno)
    if (err) {
      alert(err)  // TODO Dialog UI.
    } else {
      alert('Success.')  // TODO Dialog UI.
    }

  })
}

/*
 * Enable UI.
 */
function enable () {
  $('#exportAnnoButton').removeAttr('disabled')
}

/*
 * Disable UI.
 */
function disable () {
  $('#exportAnnoButton').attr('disabled', 'disabled')
}

/**
 * Get the file name for download.
 */
function getDownloadFileName () {

  if (parseUrlQuery()['paper_id']) {
    return parseUrlQuery()['paper_id'] + '.pdf.txt'
  }

  // TODO Refactoring. this function is similar to the one in downloadButton.

  // The name of Primary Annotation.
  let primaryAnnotationName
  $('#dropdownAnnoPrimary a').each((index, element) => {
    let $elm = $(element)
    if ($elm.find('.fa-check').hasClass('no-visible') === false) {
      primaryAnnotationName = $elm.find('.js-annoname').text()
    }
  })
  if (primaryAnnotationName) {
    // return primaryAnnotationName.replace('.anno', '') + 'pdftxt'
    return primaryAnnotationName.replace(`.${constants.ANNO_FILE_EXTENSION}`, '') + 'pdftxt'
  }

  // The name of Content.
  let pdfFileName = window.annoPage.getCurrentContentFile().name
  return pdfFileName + '.txt'
}

/**
 * Upload annotations
 * @param anno
 * @returns {Promise<Error>}
 */
async function uploadAnnotation (anno) {
  const params = parseUrlQuery()
  const url = params['callback_url']
  const response = await fetch(url, {
    method : 'PUT',
    body   : JSON.stringify({
      // api_root : apiRoot,
      // token    : userToken,
      anno
    }),
    headers : new Headers({ 'Content-type' : 'application/json' })
  })
  console.log('response:', response)
  const body = await response.json()
  console.log(response.status, body)
  if (response.status !== 200) {
    return body.message
  }
  return null
}
