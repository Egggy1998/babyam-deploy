/**
 * GOOGLE APPS SCRIPT - TỰ ĐỘNG LƯU ĐƠN BÁO GIÁ SỈ CHO BABY A&M
 * ID Google Sheet: 1z8tGz1XTUGJr3AHXqxvs7ttSy8VASK4gDnfwBrVxGZo
 */

const SPREADSHEET_ID = "1z8tGz1XTUGJr3AHXqxvs7ttSy8VASK4gDnfwBrVxGZo";
const NOTIFY_EMAIL = "ctyankhaiminh@gmail.com";

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Baby A&M Webhook đang hoạt động bình thường!",
    spreadsheetId: SPREADSHEET_ID
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // 1. Mở chính xác Google Sheet theo ID
    let ss;
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (openErr) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!ss) {
      throw new Error("Không thể mở Google Sheet với ID: " + SPREADSHEET_ID);
    }

    // 2. Lấy tab đầu tiên của bảng tính (hoặc tab tên Đăng Ký Báo Giá Sỉ nếu có)
    let sheet = ss.getSheetByName("Đăng Ký Báo Giá Sỉ");
    if (!sheet) {
      sheet = ss.getSheets()[0]; // Dùng ngay tab hiện tại của bạn
    }

    // Nếu tab còn trống (chưa có dòng tiêu đề), tự động tạo tiêu đề
    if (sheet.getLastRow() === 0) {
      const headers = [
        "Thời gian đăng ký",
        "Họ và tên",
        "Số điện thoại (Zalo)",
        "Tên shop / Đại lý / Khu vực",
        "Sản phẩm quan tâm",
        "Lời nhắn / Yêu cầu",
        "Trạng thái xử lý"
      ];
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#335f49"); // Màu xanh Baby A&M
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // 3. Trích xuất dữ liệu gửi lên (hỗ trợ cả URLSearchParams và JSON)
    let data = {};
    if (e.parameter && Object.keys(e.parameter).length > 0) {
      data = e.parameter;
    } else if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = {};
      }
    }

    const timestamp = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
    const fullName = data.fullName || data.name || "Khách hàng";
    const phone = data.phone || "";
    const storeArea = data.storeArea || data.store || "";
    const productInterest = data.productInterest || data.product || "";
    const message = data.message || "";

    // 4. Thêm dòng mới vào Google Sheet
    sheet.appendRow([
      timestamp,
      fullName,
      "'" + phone, // Dấu nháy đơn giữ nguyên số 0 ở đầu SĐT
      storeArea,
      productInterest,
      message,
      "Mới tiếp nhận"
    ]);

    // 5. Gửi email thông báo cho quản trị viên
    if (NOTIFY_EMAIL && phone) {
      try {
        MailApp.sendEmail({
          to: NOTIFY_EMAIL,
          subject: `[Baby A&M] Khách đăng ký báo giá sỉ: ${fullName} - ${phone}`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #161d18;">
              <h2 style="color: #335f49; border-bottom: 2px solid #335f49; padding-bottom: 8px;">Khách Đăng Ký Báo Giá Sỉ Mới</h2>
              <p><strong>Thời gian:</strong> ${timestamp}</p>
              <p><strong>Họ và tên:</strong> ${fullName}</p>
              <p><strong>Số điện thoại:</strong> <a href="tel:${phone}">${phone}</a> (Zalo: <a href="https://zalo.me/${phone}">${phone}</a>)</p>
              <p><strong>Tên shop / Đại lý / Khu vực:</strong> ${storeArea}</p>
              <p><strong>Dòng sữa quan tâm:</strong> ${productInterest}</p>
              <p><strong>Lời nhắn:</strong> ${message}</p>
              <p><strong>Bảng tính lưu trữ:</strong> <a href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}">Xem trên Google Sheets</a></p>
            </div>
          `
        });
      } catch (mailErr) {
        Logger.log("Email error: " + mailErr.toString());
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã lưu vào sheet thành công!",
      row: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
