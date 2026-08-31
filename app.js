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

    const nextGoal = document.getElementById('next-goal');
    const nextGoalText = document.getElementById('next-goal-text');

    const chibiNormal = document.getElementById('chibi-normal');

    // Các phần tử modal hướng dẫn
    const btnToggleGuide = document.getElementById('btn-toggle-guide');
    const modalGuide = document.getElementById('modal-guide');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // Khởi tạo tính năng chia sẻ (QR + copy link)
    initShare();

    // Sự kiện khi nhấn nút Tính Điểm
    btnCalculate.addEventListener('click', calculateGPA);

    // Sự kiện mở/đóng modal hướng dẫn
    if (btnToggleGuide && modalGuide && btnCloseModal) {
        btnToggleGuide.addEventListener('click', () => {
            modalGuide.classList.add('active');
        });

        btnCloseModal.addEventListener('click', () => {
            modalGuide.classList.remove('active');
        });

        modalGuide.addEventListener('click', (e) => {
            if (e.target === modalGuide) {
                modalGuide.classList.remove('active');
            }
        });
    }

    // Cho phép nhấn Enter trong ô nhập để tính điểm nhanh
    correctInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') totalInput.focus();
    });
    totalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateGPA();
    });

    /**
     * Chia sẻ công cụ: mở modal, vẽ mã QR trỏ về trang này và copy link
     */
    function initShare() {
        const btnShare = document.getElementById('btn-share');
        const modalShare = document.getElementById('modal-share');
        const btnCloseShare = document.getElementById('btn-close-share');
        const btnCopyLink = document.getElementById('btn-copy-link');
        const btnNativeShare = document.getElementById('btn-native-share');
        const shareLink = document.getElementById('share-link');
        const qrBox = document.getElementById('qr-box');
        if (!btnShare || !modalShare) return;

        // Link sạch (bỏ query/hash) của chính trang đang mở
        const pageUrl = location.origin + location.pathname;
        shareLink.value = pageUrl;

        let qrDrawn = false;
        function drawQR() {
            if (qrDrawn || typeof QRCode === 'undefined') return;
            new QRCode(qrBox, {
                text: pageUrl,
                width: 190,
                height: 190,
                colorDark: '#123c5e',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            qrDrawn = true;
        }

        btnShare.addEventListener('click', () => {
            drawQR();
            modalShare.classList.add('active');
        });

        btnCloseShare.addEventListener('click', () => modalShare.classList.remove('active'));
        modalShare.addEventListener('click', (e) => {
            if (e.target === modalShare) modalShare.classList.remove('active');
        });

        btnCopyLink.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(pageUrl);
            } catch (err) {
                // Trình duyệt cũ / trang không chạy https thì dùng cách chọn văn bản
                shareLink.select();
                document.execCommand('copy');
            }
            btnCopyLink.textContent = '✓ Đã copy';
            btnCopyLink.classList.add('copied');
            setTimeout(() => {
                btnCopyLink.textContent = 'Copy';
                btnCopyLink.classList.remove('copied');
            }, 1800);
        });

        // Điện thoại có sẵn menu chia sẻ hệ thống thì hiện thêm nút này
        if (navigator.share) {
            btnNativeShare.hidden = false;
            btnNativeShare.addEventListener('click', () => {
                navigator.share({
                    title: 'Tính Điểm Hệ 4 - CLB Tình Nguyện Trường Y',
                    text: 'Công cụ tính điểm hệ 4 siêu nhanh nè!',
                    url: pageUrl
                }).catch(() => {});
            });
        }
    }

    /**
     * Tạo một bong bóng với kích thước / vị trí / tốc độ ngẫu nhiên
     */
    function createBubble() {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        // Random kích thước bong bóng từ 25px đến 130px
        const size = Math.floor(Math.random() * 105) + 25;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;

        // Random vị trí bắt đầu theo chiều ngang (0% - 100%)
        bubble.style.left = `${Math.random() * 100}%`;

        // Bong bóng nhỏ thì mờ & bay nhanh hơn, tạo cảm giác chiều sâu
        const depth = size / 130;
        bubble.style.setProperty('--bubble-opacity', (0.28 + depth * 0.45).toFixed(2));
        bubble.style.setProperty('--bubble-drift', `${(Math.random() * 90 - 45).toFixed(0)}px`);

        // Random thời gian trễ và thời gian chạy animation để các bong bóng bay so le
        bubble.style.animationDelay = `${(Math.random() * -18).toFixed(1)}s`;
        bubble.style.animationDuration = `${(Math.random() * 12 + 14).toFixed(1)}s`;
        bubble.style.animationTimingFunction = 'ease-in-out';

        return bubble;
    }

    /**
     * Hàm khởi tạo các bong bóng bay lơ lửng + gắn tương tác chọc/kéo
     */
    function initBackgroundBubbles() {
        const bubbleContainer = document.getElementById('bg-bubbles');
        if (!bubbleContainer) return;

        const bubbleCount = 24; // Số lượng bong bóng lơ lửng
        for (let i = 0; i < bubbleCount; i++) {
            bubbleContainer.appendChild(createBubble());
        }

        let drag = null; // Thông tin bong bóng đang bị giữ

        // Các phần tử "chắn" - chạm trúng chúng thì không chọc bong bóng phía sau
        const BLOCKERS = '.calculator-card, .results-container, .modal-backdrop, .btn-discovery, input, button, a';

        /**
         * Tìm bong bóng ngay dưới điểm chạm.
         * Trên điện thoại, target của sự kiện thường là lớp nền chứ không phải
         * bong bóng (do bong bóng nằm ở z-index âm), nên phải dò theo toạ độ.
         */
        function bubbleAt(x, y, target) {
            const direct = target && target.closest && target.closest('.bubble');
            if (direct) return direct;

            // Duyệt từ trên xuống: gặp bong bóng thì lấy, gặp thẻ nội dung thì bỏ qua
            for (const el of document.elementsFromPoint(x, y)) {
                if (el.classList && el.classList.contains('bubble')) return el;
                if (el.closest && el.closest(BLOCKERS)) return null;
            }
            return null;
        }

        /**
         * "Đóng băng" bong bóng tại đúng chỗ nó đang hiển thị:
         * tắt animation và chuyển sang toạ độ px tuyệt đối
         */
        function freezeBubble(bubble) {
            const box = bubble.getBoundingClientRect();
            const parent = bubbleContainer.getBoundingClientRect();

            bubble.style.animation = 'none';
            bubble.style.transform = 'none';
            bubble.style.bottom = 'auto';
            bubble.style.left = `${box.left - parent.left}px`;
            bubble.style.top = `${box.top - parent.top}px`;
            bubble.style.opacity = bubble.style.getPropertyValue('--bubble-opacity') || '0.55';

            return { width: box.width, height: box.height, parent };
        }

        /**
         * Chọc vỡ bong bóng, sau đó thả một bong bóng mới vào cho đủ số lượng
         */
        function popBubble(bubble) {
            if (bubble.classList.contains('is-popping')) return;
            freezeBubble(bubble);
            bubble.classList.remove('is-dragging');
            bubble.classList.add('is-popping');
            bubble.addEventListener('animationend', () => {
                bubble.remove();
                bubbleContainer.appendChild(createBubble());
            }, { once: true });
        }

        // Chặn cuộn trang khi đang kéo bong bóng trên điện thoại
        function blockScroll(e) {
            if (drag) e.preventDefault();
        }
        document.addEventListener('touchmove', blockScroll, { passive: false });

        document.addEventListener('pointerdown', (e) => {
            const bubble = bubbleAt(e.clientX, e.clientY, e.target);
            if (!bubble || bubble.classList.contains('is-popping')) return;

            const box = freezeBubble(bubble);
            bubble.classList.remove('is-free');
            bubble.classList.add('is-dragging');

            drag = {
                bubble,
                parent: box.parent,
                // Khoảng lệch giữa điểm bấm và góc bong bóng
                offsetX: e.clientX - (box.parent.left + parseFloat(bubble.style.left)),
                offsetY: e.clientY - (box.parent.top + parseFloat(bubble.style.top)),
                startX: e.clientX,
                startY: e.clientY,
                moved: false
            };
        });

        document.addEventListener('pointermove', (e) => {
            if (!drag) return;
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            if (Math.hypot(dx, dy) > 4) drag.moved = true;

            drag.bubble.style.left = `${e.clientX - drag.parent.left - drag.offsetX}px`;
            drag.bubble.style.top = `${e.clientY - drag.parent.top - drag.offsetY}px`;
        });

        function endDrag() {
            if (!drag) return;
            const { bubble, moved } = drag;
            drag = null;
            bubble.classList.remove('is-dragging');

            if (!moved) {
                // Bấm mà không kéo => chọc vỡ
                popBubble(bubble);
            } else {
                // Thả tay => bong bóng bay tiếp lên trên từ chỗ mới
                bubble.style.animation = '';
                bubble.classList.add('is-free');
                // Bay hết màn hình thì thay bằng bong bóng mới
                bubble.addEventListener('animationend', () => {
                    bubble.remove();
                    bubbleContainer.appendChild(createBubble());
                }, { once: true });
            }
        }

        document.addEventListener('pointerup', endDrag);
        document.addEventListener('pointercancel', endDrag);
    }

    /**
     * Hàm chính tính toán điểm hệ 10, hệ 4 và quy đổi xếp loại
     * Chuẩn công thức UMP 3 đoạn:
     * - x < 0.5y        : Điểm = 8 * (x / y)
     * - 0.5y <= x < 0.6y: Điểm = 4.0 + 10 * ((x - 0.5y) / y)
     * - x >= 0.6y       : Điểm = 5.0 + 12.5 * ((x - 0.6y) / y)
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
        const halfY = 0.5 * y;
        const pointSixY = 0.6 * y;

        if (x < halfY) {
            score10 = (8 * x) / y;
        } else if (x < pointSixY) {
            score10 = 4.0 + (10 * (x - halfY)) / y;
        } else {
            score10 = 5.0 + (12.5 * (x - pointSixY)) / y;
        }

        // Làm tròn điểm hệ 10 đến 2 chữ số thập phân
        score10 = Math.round((score10 + Number.EPSILON) * 100) / 100;
        score10 = Math.max(0, Math.min(10, score10));

        // 4. Quy đổi sang hệ 4, điểm chữ, xếp loại và lấy lời nhắn tương ứng chuẩn Bảng quy đổi UMP
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
            classification = 'Giỏi (Mốc 4.0 Hệ 4)';
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
        } else if (score10 >= 6.5) {
            score4 = 2.5;
            letterGrade = 'C+';
            classification = 'Trung bình khá';
            message = "Cũng khá ổn áp nè, cố gắng thêm xíu nữa là lên B rồi! ✨";
        } else if (score10 >= 5.5) {
            score4 = 2.0;
            letterGrade = 'C';
            classification = 'Trung bình';
            message = "Bạn đã qua môn! Đây là một cột mốc quan trọng. Hãy coi đây là động lực để bứt phá hơn nha. 💪";
        } else if (score10 >= 5.0) {
            score4 = 1.5;
            letterGrade = 'D+';
            classification = 'Trung bình yếu';
            message = "Suýt soát rồi, nhưng vẫn qua môn! Cố gắng ôn tập kỹ hơn ở các môn sau nha. 📚";
        } else if (score10 >= 4.0) {
            score4 = 1.0;
            letterGrade = 'D';
            classification = 'Yếu (Chạm sàn qua môn)';
            message = "Chạm sàn qua môn trong gang tấc! Lần sau phải cẩn thận hơn nữa đó nè. 🍀";
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
        const percent = ((x / y) * 100).toFixed(1);
        resRatioPercent.textContent = `Đúng ${x}/${y} câu (${percent}%)`;
        resGrade.textContent = `Xếp loại: ${classification}`;

        // Mốc điểm hệ 4 kế tiếp: cần thêm bao nhiêu câu đúng nữa
        showNextGoal(x, y, score10);

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
     * Các mốc điểm hệ 4 theo bảng quy đổi (ngưỡng điểm hệ 10 -> hệ 4 & điểm chữ)
     */
    const GPA_TIERS = [
        { min10: 4.0, gpa: 1.0, letter: 'D' },
        { min10: 5.0, gpa: 1.5, letter: 'D+' },
        { min10: 5.5, gpa: 2.0, letter: 'C' },
        { min10: 6.5, gpa: 2.5, letter: 'C+' },
        { min10: 7.0, gpa: 3.0, letter: 'B' },
        { min10: 8.0, gpa: 3.5, letter: 'B+' },
        { min10: 8.5, gpa: 4.0, letter: 'A' }
    ];

    /**
     * Đảo ngược công thức UMP: cần tối thiểu bao nhiêu câu đúng để đạt điểm hệ 10 mục tiêu
     */
    function minCorrectFor(target10, y) {
        if (target10 < 4.0) return (target10 * y) / 8;
        if (target10 < 5.0) return 0.5 * y + ((target10 - 4.0) * y) / 10;
        return 0.6 * y + ((target10 - 5.0) * y) / 12.5;
    }

    /**
     * Hiển thị khối "còn thiếu bao nhiêu câu để lên mốc hệ 4 kế tiếp"
     */
    function showNextGoal(x, y, score10) {
        const tier = GPA_TIERS.find(t => score10 < t.min10);

        // Đã chạm trần 4.0 thì không còn mốc nào để leo nữa
        if (!tier) {
            nextGoal.hidden = false;
            nextGoal.classList.add('is-max');
            nextGoalText.innerHTML = '🏆 Bạn đã chạm mốc <strong>4.0</strong> tuyệt đối rồi, không còn gì để leo nữa luôn!';
            return;
        }

        const needExact = minCorrectFor(tier.min10, y);
        const missing = Math.max(1, Math.ceil(needExact - x - 1e-9));

        nextGoal.hidden = false;
        nextGoal.classList.remove('is-max');
        nextGoalText.innerHTML =
            `🎯 Chỉ còn <strong>${missing} câu</strong> nữa là đạt được ` +
            `<strong>${tier.gpa.toFixed(1)}</strong> hệ 4 (điểm <strong>${tier.letter}</strong>) rồi!`;
    }

    /**
     * Hàm hiển thị thông báo lỗi trên card kết quả
     */
    function showError(errText) {
        nextGoal.hidden = true;
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

/* ====================================================
   PWA - CÀI APP VỀ ĐIỆN THOẠI + DÙNG OFFLINE
   ==================================================== */
(function initInstallApp() {
    // Đăng ký service worker (bắt buộc để cài được + chạy offline)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').catch(function () {});
        });
    }

    const btnInstall = document.getElementById('btn-install');
    const toast = document.getElementById('install-toast');
    const btnCloseToast = document.getElementById('install-toast-close');
    if (!btnInstall) return;

    const DISMISS_KEY = 'tinhdiem4-an-nhac-cai-app';

    function daTat() {
        try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
    }
    function ghiNhoDaTat() {
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
    }
    function anToast() {
        if (toast) toast.hidden = true;
    }
    function hienNutVaToast() {
        btnInstall.hidden = false;
        if (toast && !daTat()) toast.hidden = false;
    }
    // Đã cài xong hoặc đang mở dạng app -> giấu hết, không nhắc nữa
    function daCaiXong() {
        btnInstall.hidden = true;
        anToast();
    }

    // Đang mở dạng app rồi thì khỏi hiện gì cả
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
    if (isStandalone) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    let deferredPrompt = null;

    // Android / Chrome: trình duyệt báo "cài được" thì mới hiện nút
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredPrompt = e;
        hienNutVaToast();
    });

    // iOS không có beforeinstallprompt -> luôn hiện để chỉ cách cài thủ công
    if (isIOS) hienNutVaToast();

    btnInstall.addEventListener('click', function () {
        anToast();
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.finally(function () {
                deferredPrompt = null;
                btnInstall.hidden = true;
            });
            return;
        }
        alert('Cách cài trên iPhone/iPad:\n1. Mở trang này bằng Safari\n2. Bấm nút Chia sẻ ở thanh dưới\n3. Chọn "Thêm vào MH chính" (Add to Home Screen)');
    });

    // Bấm vào thông báo cũng cài luôn cho nhanh
    if (toast) {
        toast.addEventListener('click', function (e) {
            if (e.target === btnCloseToast) return;
            btnInstall.click();
        });
    }

    // Bấm dấu X: tắt hẳn, lần sau vào không nhắc nữa
    if (btnCloseToast) {
        btnCloseToast.addEventListener('click', function (e) {
            e.stopPropagation();
            anToast();
            ghiNhoDaTat();
        });
    }

    // Cài xong -> gỡ cả nút lẫn thông báo
    window.addEventListener('appinstalled', daCaiXong);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', function (e) {
        if (e.matches) daCaiXong();
    });
})();
