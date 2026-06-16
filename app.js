document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo bong bóng bay lơ lửng ở hình nền
    initBackgroundBubbles();

    // Lấy các phần tử DOM cần thiết
    const correctInput = document.getElementById('correct-answers');
    const totalInput = document.getElementById('total-questions');
    const btnCalculate = document.getElementById('btn-calculate');
    const resultsWrapper = document.getElementById('results-wrapper');
    
    const resScore10 = document.getElementById('res-score10');
    const resScore4 = document.getElementById('res-score4');
    const resLetter = document.getElementById('res-letter');
    const resMessage = document.getElementById('res-message');
    const resRatioPercent = document.getElementById('res-ratio-percent');
    const resGrade = document.getElementById('res-grade');

    const chibiNormal = document.getElementById('chibi-normal');

    // Sự kiện khi nhấn nút Tính Điểm
    btnCalculate.addEventListener('click', calculateGPA);

    // Cho phép nhấn Enter trong ô nhập để tính điểm nhanh
    correctInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') totalInput.focus();
    });
    totalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateGPA();
    });

    /**
     * Hàm khởi tạo các bong bóng tròn bay từ dưới lên
     */
    function initBackgroundBubbles() {
        const bubbleContainer = document.getElementById('bg-bubbles');
        if (!bubbleContainer) return;

        const bubbleCount = 20; // Số lượng bong bóng lơ lửng
        for (let i = 0; i < bubbleCount; i++) {
            const bubble = document.createElement('div');
            bubble.classList.add('bubble');
            
            // Random kích thước bong bóng từ 10px đến 45px
            const size = Math.floor(Math.random() * 35) + 10;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            
            // Random vị trí bắt đầu theo chiều ngang (0% - 100%)
            bubble.style.left = `${Math.random() * 100}%`;
            
            // Random thời gian trễ và thời gian chạy animation để các bong bóng bay so le
            bubble.style.animationDelay = `${Math.random() * 8}s`;
            bubble.style.animationDuration = `${Math.random() * 10 + 10}s`;
            
            bubbleContainer.appendChild(bubble);
        }
    }

    /**
     * Hàm chính tính toán điểm hệ 10, hệ 4 và quy đổi xếp loại
     */
    function calculateGPA() {
        // Lấy giá trị đầu vào
        const xStr = correctInput.value.trim();
        const yStr = totalInput.value.trim();

        // 1. Kiểm tra để trống
        if (xStr === '' || yStr === '') {
            showError('Vui lòng nhập đầy đủ cả số câu đúng và tổng số câu thi nha!');
            return;
        }

        const x = parseFloat(xStr);
        const y = parseFloat(yStr);

        // 2. Kiểm tra tính hợp lệ của số liệu
        if (isNaN(x) || isNaN(y)) {
            showError('Số câu nhập vào phải là số hợp lệ bạn ơi!');
            return;
        }
        if (x < 0 || y <= 0) {
            showError('Số câu đúng phải từ 0 trở lên và tổng số câu phải lớn hơn 0 nhé!');
            return;
        }
        if (x > y) {
            showError('Số câu đúng không được vượt quá tổng số câu thi đâu nè (Số câu đúng: ' + x + ' / Tổng: ' + y + ')!');
            return;
        }

        // 3. Tính điểm hệ 10 theo công thức phi tuyến tính chuẩn UMP
        let score10 = 0;
        const n = x / y; // Tỷ lệ câu trả lời đúng

        if (n < 0.5) {
            score10 = (8 * x) / y;
        } else if (Math.abs(n - 0.5) < 1e-9) { // n === 0.5
            score10 = 4.0;
        } else if (n > 0.5 && n < 0.6) {
            score10 = 4.0 + (10 * (x - 0.5 * y)) / y;
        } else if (Math.abs(n - 0.6) < 1e-9) { // n === 0.6
            score10 = 5.0;
        } else { // n > 0.6
            score10 = 5.0 + (12.5 * (x - 0.6 * y)) / y;
        }

        // Làm tròn điểm hệ 10 đến 2 chữ số thập phân
        score10 = Math.round((score10 + Number.EPSILON) * 100) / 100;
        // Đảm bảo điểm nằm trong khoảng [0, 10] do sai số làm tròn số thực
        score10 = Math.max(0, Math.min(10, score10));

        // 4. Quy đổi sang hệ 4, điểm chữ, xếp loại và lấy lời nhắn tương ứng
        let score4 = 0.0;
        let letterGrade = 'F';
        let classification = 'Kém (Không đạt)';
        let message = '';

        if (score10 >= 9.5) {
            score4 = 4.0;
            letterGrade = 'A+';
            classification = 'Xuất sắc';
            message = "Ối dồi ôi, ối dồi ôi, trình là gì mà là trình ai chấm 🌟";
        } else if (score10 >= 8.5) {
            score4 = 4.0;
            letterGrade = 'A';
            classification = 'Giỏi';
            message = "Dỏi cá àaaaaa, tuyệt vời lắm gút chóp em 🎉";
        } else if (score10 >= 8.0) {
            score4 = 3.5;
            letterGrade = 'B+';
            classification = 'Khá giỏi';
            message = "Khổ thuyệt á chớ, xíu nữa là 4.0 òi 🥺";
        } else if (score10 >= 7.0) {
            score4 = 3.0;
            letterGrade = 'B';
            classification = 'Khá';
            message = "Ôi chu choa, cũng lằng tà lằng nhằng phết í 👍";
        } else if (score10 >= 5.5) {
            score4 = 2.0;
            letterGrade = 'C';
            classification = 'Trung bình';
            message = "Bạn đã qua môn! Đây là một cột mốc quan trọng. Hãy coi đây là động lực để tập trung và bứt phá hơn trong tương lai. 💪";
        } else if (score10 >= 5.0) {
            score4 = 1.5;
            letterGrade = 'D+';
            classification = 'Trung bình yếu';
            message = "Suýt soát rồi, nhưng vẫn qua môn! Môn học này có vẻ khá thử thách. Đừng ngần ngại tìm kiếm sự giúp đỡ từ bạn bè hoặc các anh chị nhé. 📚";
        } else if (score10 >= 4.0) {
            score4 = 1.0;
            letterGrade = 'D';
            classification = 'Yếu';
            message = "Suýt soát rồi, nhưng vẫn qua môn! Môn học này có vẻ khá thử thách. Đừng ngần ngại tìm kiếm sự giúp đỡ từ bạn bè hoặc các anh chị nhé. 📚";
        } else { // < 4.0
            score4 = 0.0;
            letterGrade = 'F';
            classification = 'Kém (Không đạt)';
            message = "Đừng nản lòng! Ai cũng có những lúc không như ý. Điều quan trọng là đứng dậy và tìm ra phương pháp học tập hiệu quả hơn. CLB luôn sẵn sàng hỗ trợ bạn. Vìa đây anh chị thưn thưn. ❤️";
        }

        // 5. Hiển thị kết quả ra giao diện
        resScore10.textContent = score10.toFixed(2);
        resScore4.textContent = score4.toFixed(1);
        resLetter.textContent = letterGrade;
        
        // Trả lại định dạng viền/màu chữ message bình thường
        resMessage.innerHTML = `<span>💌</span> ${message}`;
        resMessage.style.color = '#ff3e6c';
        resMessage.style.borderLeftColor = '#ff3e6c';
        resMessage.style.background = '#fff5f7';

        // Cập nhật 2 card phụ phía dưới
        const percent = (n * 100).toFixed(1);
        resRatioPercent.textContent = `Đúng ${x}/${y} câu (${percent}%)`;
        resGrade.textContent = `Xếp loại: ${classification}`;

        // 6. Kích hoạt hiệu ứng mở rộng phần kết quả
        resultsWrapper.classList.add('show');
        
        // Ẩn cô bé 1 ở card tính điểm
        chibiNormal.classList.add('hide');

        // Cuộn mượt màn hình xuống vùng kết quả sau khi hiển thị xong transition
        setTimeout(() => {
            resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
    }

    /**
     * Hàm hiển thị thông báo lỗi trên card kết quả
     */
    function showError(errText) {
        // Cài đặt các giá trị trống/không xác định
        resScore10.textContent = '-';
        resScore4.textContent = '-';
        resLetter.textContent = '-';
        
        resRatioPercent.textContent = 'Nhập sai dữ liệu';
        resGrade.textContent = 'Lỗi nhập liệu';

        // Hiển thị thông báo lỗi nổi bật trong ô tin nhắn
        resMessage.innerHTML = `⚠️ ${errText}`;
        resMessage.style.color = '#c0392b';
        resMessage.style.borderLeftColor = '#c0392b';
        resMessage.style.background = '#fdedec';

        // Hiển thị card kết quả (để hiện lỗi)
        resultsWrapper.classList.add('show');
        
        // Vẫn giữ lại cô bé đáng yêu 1 nếu là lỗi nhập liệu
        chibiNormal.classList.remove('hide');

        // Cuộn xuống để người dùng thấy thông báo lỗi rõ ràng
        setTimeout(() => {
            resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
    }
});
