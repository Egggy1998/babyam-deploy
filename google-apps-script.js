/**
 * GOOGLE APPS SCRIPT - TỰ ĐỘNG LƯU ĐƠN BÁO GIÁ SỈ CHO BABY A&M
 * 
 * HƯỚNG DẪN CÀI ĐẶT TRONG 2 PHÚT:
 * 1. Mở Google Sheet bạn muốn lưu dữ liệu (hoặc tạo file mới).
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết code cũ, dán toàn bộ đoạn code dưới đây vào file Code.gs.
 * 4. Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải -> "Quản lý bản triển khai mới" (New deployment).
 * 5. Chọn loại: "Ứng dụng web" (Web app).
 *    - Mô tả: "Baby A&M Form Webhook"
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone) -> RẤT QUAN TRỌNG!
 * 6. Nhấn "Triển khai" (Deploy), cấp quyền truy cập tài khoản Google khi được hỏi.
 * 7. Copy URL Ứng dụng web (có đuôi /exec) và dán vào biến GOOGLE_APPS_SCRIPT_URL trong file index.html.
 */

// Cấu hình email nhận thông báo khi có khách đăng ký mới (để trống nếu không muốn nhận email)
const NOTIFY_EMAIL = "ctyankhaiminh@gmail.com";
const SHEET_NAME = "Đăng Ký Báo Giá Sỉ";

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Baby A&M Google Apps Script Webhook đang hoạt động bình thường!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Tránh xung đột khi nhiều người cùng bấm gửi

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Nếu chưa có tab sheet này thì tự động tạo mới kèm tiêu đề
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
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
      
      // Định dạng header đẹp mắt
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#335f49"); // Màu xanh thương hiệu Baby A&M
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // Trích xuất dữ liệu gửi lên (hỗ trợ cả JSON body và form urlencoded)
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    const timestamp = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
    const fullName = data.fullName || data.name || "";
    const phone = data.phone || "";
    const storeArea = data.storeArea || data.store || "";
    const productInterest = data.productInterest || data.product || "";
    const message = data.message || "";
    const status = "Mới tiếp nhận";

    // Thêm dòng mới vào Google Sheet
    sheet.appendRow([
      timestamp,
      fullName,
      "'" + phone, // Thêm dấu ' để giữ nguyên số 0 ở đầu số điện thoại
      storeArea,
      productInterest,
      message,
      status
    ]);

    // Tự động căn chỉnh độ rộng cột vừa vặn
    sheet.autoResizeColumns(1, 7);

    // Gửi email thông báo cho quản trị viên (nếu có cấu hình email)
    if (NOTIFY_EMAIL && phone) {
      try {
        const subject = `[Baby A&M] Khách đăng ký báo giá sỉ mới: ${fullName} - ${phone}`;
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #161d18;">
            <h2 style="color: #335f49; border-bottom: 2px solid #335f49; padding-bottom: 8px;">Khách Đăng Ký Báo Giá Sỉ Mới</h2>
            <p><strong>Thời gian:</strong> ${timestamp}</p>
            <p><strong>Họ và tên:</strong> ${fullName}</p>
            <p><strong>Số điện thoại:</strong> <a href="tel:${phone}">${phone}</a> (Zalo: <a href="https://zalo.me/${phone}">${phone}</a>)</p>
            <p><strong>Tên shop / Đại lý:</strong> ${storeArea}</p>
            <p><strong>Sản phẩm quan tâm:</strong> ${productInterest}</p>
            <p><strong>Lời nhắn:</strong> ${message}</p>
            <hr style="border: 1px solid #e5ebe5; margin: 20px 0;">
            <p style="font-size: 12px; color: #5c6b61;">Email tự động gửi từ hệ thống Website Baby A&M.</p>
          </div>
        `;
        MailApp.sendEmail({
          to: NOTIFY_EMAIL,
          subject: subject,
          htmlBody: htmlBody
        });
      } catch (mailErr) {
        Logger.log("Lỗi gửi email: " + mailErr.toString());
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Dữ liệu đã được lưu thành công vào Google Sheet!"
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
