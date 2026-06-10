Update:
1. Tab "Tạo Bài Tập Mới"
- Hạn Chót Cuối Cùng: Chỉ cần fill ngày tháng, không cần giờ và phút
- Tạo 1 component upload bài giảng -> Chúng ta sẽ tạo lộ trình thực sự dựa trên bài giảng pdf gốc của môn học
- Specs:
Thay vì bắt sinh viên nhập từng task, app sẽ tự động "xẻ nhỏ" bài tập lớn.

Input bao gồm: 
- Tên môn học
- Hạn chót cuối cùng (Final Deadline)
- File tài liệu bài giảng môn học
- Mức độ khó (1-5)

2. Lộ trình được generate bởi Gemini API Key đã có trong .env, hãy nhận kết quả từ Gemini
Tự động tính toán "giá trị" của mỗi mốc dựa trên tâm lý học hành vi.

Tính năng: Khi sinh viên nạp 1000 điểm cọc vào dự án, app tự động phân bổ theo tỷ lệ tăng dần. 
Ví dụ:
- Mốc 1: Cọc 200 điểm (Mồi nhử để bắt đầu ngay).
- Mốc 2: Cọc 300 điểm.
- Mốc 3: Cọc 500 điểm (Áp lực lớn nhất ở giai đoạn nước rút).

3. Logic hoàn/trừ điểm
- Tính năng: Nút bấm "Đã hoàn thành" để sinh viên xác nhận.
- Xử lý: 
    + Nếu bấm trước hạn: Hoàn lại điểm vào ví.
    + Nếu quá hạn mà chưa bấm: Hệ thống tự động xóa vĩnh viễn số điểm đó khỏi tài khoản.
- Điều kiện để bấm nút "Đã hoàn thành"
    + Upload ít nhất 1 file note các kiến thức đã học
    + Trả lời đúng các câu hỏi kiểm tra liên quan đến bài học (các câu hỏi này cũng được AI Gemini tự động generate khi user bấm hoàn thành để trả lời các câu hỏi)