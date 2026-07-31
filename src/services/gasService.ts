import { DiaryEntry } from '../types';

const GAS_URL_STORAGE_KEY = 'my_diary_gas_webapp_url';

export function getStoredGasUrl(): string {
  return localStorage.getItem(GAS_URL_STORAGE_KEY) || '';
}

export function setStoredGasUrl(url: string): void {
  localStorage.setItem(GAS_URL_STORAGE_KEY, url.trim());
}

export async function saveEntryToGAS(
  entry: DiaryEntry,
  gasUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const targetUrl = gasUrl || getStoredGasUrl();
  if (!targetUrl) {
    return { success: false, error: '구글 앱스 스크립트(GAS) Web App URL이 설정되지 않았습니다.' };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // avoiding CORS preflight in GAS
      },
      body: JSON.stringify({
        action: 'save',
        ...entry,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error('GAS save entry error:', err);
    return { success: false, error: err.message || '구글 시트 저장 실패' };
  }
}

export async function fetchEntriesFromGAS(
  gasUrl?: string
): Promise<{ success: boolean; entries?: DiaryEntry[]; error?: string }> {
  const targetUrl = gasUrl || getStoredGasUrl();
  if (!targetUrl) {
    return { success: false, error: 'GAS URL 미설정' };
  }

  try {
    const response = await fetch(`${targetUrl}?action=getHistory`, {
      method: 'GET',
    });
    const data = await response.json();
    if (data && data.entries) {
      return { success: true, entries: data.entries };
    }
    return { success: false, error: data.error || '데이터 조회 실패' };
  } catch (err: any) {
    console.error('GAS fetch entries error:', err);
    return { success: false, error: err.message || '구글 시트 연동 오류' };
  }
}

export async function deleteEntryFromGAS(
  id: string,
  gasUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const targetUrl = gasUrl || getStoredGasUrl();
  if (!targetUrl) {
    return { success: false, error: 'GAS URL 미설정' };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'delete',
        id,
      }),
    });
    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error('GAS delete entry error:', err);
    return { success: false, error: err.message || '삭제 요청 실패' };
  }
}

export const GAS_SCRIPT_TEMPLATE = `// Google Apps Script (Code.gs) - 구글 시트 연동 스크립트
// [참고] script.google.com에서 독립형 스크립트로 만드신 경우 
// 아래 SPREADSHEET_ID에 구글 시트 URL 주소의 ID (예: /d/1a2b3c.../edit 의 1a2b3c...)를 적어주세요.
// 구글 시트 상단 메뉴 [확장 프로그램 > Apps Script]에서 바로 만든 경우는 빈값("")으로 두셔도 자동 연결됩니다.
var SPREADSHEET_ID = ""; 

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function getWorksheet() {
  var ss = null;

  // 1. SPREADSHEET_ID가 지정된 경우
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch(err) {
      throw new Error("SPREADSHEET_ID로 시트를 열 수 없습니다: " + err.toString());
    }
  }

  // 2. 바인딩된 시트 확인 (구글 시트 메뉴 > 확장 프로그램 > Apps Script)
  if (!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.getActive();
    } catch(err) {}
  }

  // 3. 구글 드라이브에서 '내 마음 일기장 DB' 시트를 찾거나 자동 생성
  if (!ss) {
    try {
      var files = DriveApp.getFilesByName("내 마음 일기장 DB");
      if (files.hasNext()) {
        ss = SpreadsheetApp.open(files.next());
      } else {
        ss = SpreadsheetApp.create("내 마음 일기장 DB");
      }
    } catch(err) {
      throw new Error("스프레드시트를 연결할 수 없습니다. 구글 시트의 [확장 프로그램 > Apps Script]에서 스크립트를 생성하시거나, script.google.com 사용 시 코드 6행의 SPREADSHEET_ID에 구글 시트 ID를 입력해주세요.");
    }
  }

  return ss.getActiveSheet() || ss.getSheets()[0];
}

function handleRequest(e, method) {
  var output = {};
  try {
    var sheet = getWorksheet();
    
    // 헤더 열 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "작성일시", "기분표식", "일기내용", "그림Base64", "AI선생님편지"]);
    }
    
    var data = {};
    if (method === 'POST' && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    var action = data.action || 'getHistory';

    if (action === 'save') {
      var id = data.id || 'entry_' + Date.now();
      var createdAt = data.createdAt || new Date().toLocaleString('ko-KR');
      sheet.appendRow([id, createdAt, data.mood || '', data.diaryText || '', data.imageBase64 || '', data.aiLetter || '']);
      output = { success: true, message: "구글 시트에 저장되었습니다.", id: id };
    } 
    else if (action === 'getHistory') {
      var rows = sheet.getDataRange().getValues();
      var entries = [];
      for (var i = 1; i < rows.length; i++) {
        entries.push({
          id: String(rows[i][0]),
          createdAt: String(rows[i][1]),
          mood: String(rows[i][2]),
          diaryText: String(rows[i][3]),
          imageBase64: String(rows[i][4]),
          aiLetter: String(rows[i][5])
        });
      }
      output = { success: true, entries: entries.reverse() };
    }
    else if (action === 'delete') {
      var targetId = String(data.id);
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === targetId) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      output = { success: true };
    }
  } catch (err) {
    output = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
