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

    const resultsContainer = document.querySelector('.results-container');
    const mainResultCard = document.querySelector('.main-result-card');

    // Sân khấu công thức của chế độ hồi hộp
    const calcStage = document.getElementById('calc-stage');
    const calcFormula = document.getElementById('calc-formula');
    const calcResultLine = document.getElementById('calc-result-line');
    const calcResultValue = document.getElementById('calc-result-value');

    const chibiNormal = document.getElementById('chibi-normal');

    // Chế độ hiện điểm: 'instant' (ra liền) hoặc 'suspense' (quay số hồi hộp)
    const savedMode = localStorage.getItem('reveal-mode');
    if (savedMode) {
        const saved = document.querySelector(`input[name="reveal-mode"][value="${savedMode}"]`);
        if (saved) saved.checked = true;
    }
    document.querySelectorAll('input[name="reveal-mode"]').forEach((radio) => {
        radio.addEventListener('change', () => localStorage.setItem('reveal-mode', radio.value));
    });

    // Mỗi lần bấm tính là một lượt hiện điểm mới -> lượt cũ đang chạy dở thì bỏ
    let revealToken = 0;

    // Các phần tử modal hướng dẫn
    const btnToggleGuide = document.getElementById('btn-toggle-guide');
    const modalGuide = document.getElementById('modal-guide');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // Các phần tử modal tuỳ chỉnh (chọn kiểu hiện điểm)
    const btnSettings = document.getElementById('btn-settings');
    const modalSettings = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');

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

    // Sự kiện mở/đóng modal tuỳ chỉnh kiểu hiện điểm
    if (btnSettings && modalSettings && btnCloseSettings) {
        btnSettings.addEventListener('click', () => {
            modalSettings.classList.add('active');
        });

        btnCloseSettings.addEventListener('click', () => {
            modalSettings.classList.remove('active');
        });

        modalSettings.addEventListener('click', (e) => {
            if (e.target === modalSettings) {
                modalSettings.classList.remove('active');
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

        // 5. Hiển thị kết quả — 2 chế độ: ra liền hoặc quay số hồi hộp
        const token = ++revealToken;
        const suspense = document.querySelector('input[name="reveal-mode"]:checked').value === 'suspense'
            && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Dọn tàn dư của lượt trước (bấm tính lại giữa chừng / đổi chế độ khi số còn đang bay)
        resetStage();
        document.querySelectorAll('.fly-token').forEach((el) => el.remove());
        [resScore10, resScore4, resLetter].forEach((el) => el.classList.remove('awaiting-value'));

        // Tỉ lệ đúng là số liệu tự nhập, không phải kết quả nên hiện luôn
        const percent = ((x / y) * 100).toFixed(1);
        resRatioPercent.textContent = `Đúng ${x}/${y} câu (${percent}%)`;

        // Phần chốt hạ: điểm chữ, lời nhắn, xếp loại, mốc kế tiếp và hiệu ứng ăn mừng
        const finishReveal = () => {
            resLetter.textContent = letterGrade;
            resMessage.innerHTML = `<span>💌</span> ${message}`;
            resMessage.style.color = '#ff3e6c';
            resMessage.style.borderLeftColor = '#ff3e6c';
            resMessage.style.background = '#fff5f7';
            resGrade.textContent = `Xếp loại: ${classification}`;
            showNextGoal(x, y, score10);

            // Hiệu ứng cho card kết quả
            mainResultCard.classList.remove('suspense-pulse', 'glow', 'shake');
            void mainResultCard.offsetWidth; // Trigger reflow

            if (score4 >= 3.0) {
                // Giỏi, Xuất sắc
                mainResultCard.classList.add('glow');
                if (typeof confetti === 'function') {
                    triggerConfetti();
                }
            } else if (score4 < 2.0) {
                // Yếu, Kém
                mainResultCard.classList.add('shake');
            }
        };

        if (suspense) {
            // Giấu kết quả, chạy màn công thức: số nhập bay xuống -> ra hệ 10 -> tách ra hệ 4 & điểm chữ
            nextGoal.hidden = true;
            resGrade.textContent = 'Xếp loại: ???';
            resMessage.innerHTML = '<span>🥁</span> Khoan đã, để mình bấm máy tính cái đã nha...';
            resMessage.style.color = '#ff3e6c';
            resMessage.style.borderLeftColor = '#ff3e6c';
            resMessage.style.background = '#fff5f7';
            mainResultCard.classList.remove('glow', 'shake');
            mainResultCard.classList.add('suspense-pulse');

            runFormulaShow(x, y, score10, score4, letterGrade, token, () => {
                // Lưới an toàn: vòng quay bị ngắt giữa chừng (đổi tab, rAF bị treo) thì chốt lại số
                if (resScore10.textContent !== score10.toFixed(2)) resScore10.textContent = score10.toFixed(2);
                if (resScore4.textContent !== score4.toFixed(2)) resScore4.textContent = score4.toFixed(2);
                finishReveal();
            });
        } else {
            animateValue(resScore10, 0, score10, 800, true, token);
            animateValue(resScore4, 0, score4, 800, true, token);
            finishReveal();
        }

        // 6. Kích hoạt hiệu ứng mở rộng phần kết quả
        // Trigger hiệu ứng nút bấm (làm mạnh hơn trong CSS)
        btnCalculate.classList.remove('calculated');
        void btnCalculate.offsetWidth; // Trigger reflow
        btnCalculate.classList.add('calculated');

        // Trigger lại hiệu ứng hiện kết quả nếu đã mở sẵn
        resultsWrapper.classList.remove('show');
        void resultsWrapper.offsetWidth; // Trigger reflow
        resultsWrapper.classList.add('show');

        // Ẩn cô bé 1 ở card tính điểm
        chibiNormal.classList.add('hide');

        // Cuộn mượt xuống vùng kết quả (chế độ hồi hộp tự lo phần cuộn tới công thức)
        if (!suspense) {
            setTimeout(() => {
                resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 150);
        }
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
        // Huỷ lượt hiện điểm đang chạy dở (nếu có) rồi mới ghi đè kết quả
        revealToken++;
        resetStage();
        document.querySelectorAll('.fly-token').forEach((el) => el.remove());
        [resScore10, resScore4, resLetter].forEach((el) => el.classList.remove('awaiting-value'));
        mainResultCard.classList.remove('suspense-pulse', 'stamped');

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

    /**
     * Hàm animate nhảy số
     */
    function animateValue(obj, start, end, duration, isDecimal = false, token = null) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (token !== null && token !== revealToken) return; // đã bấm tính lại
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Dùng easeOutQuart cho mượt
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentVal = progress * (end - start) + start;

            obj.textContent = isDecimal ? currentVal.toFixed(2) : Math.floor(currentVal);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.textContent = isDecimal ? end.toFixed(2) : end;
            }
        };
        window.requestAnimationFrame(step);
    }

    /**
     * Công thức UMP đúng nhánh của bài thi, chừa sẵn ô trống cho số câu đúng (x) và tổng câu (y)
     */
    function formulaHtml(x, y) {
        // Ô trống để đúng bằng số ký tự của số thật, không thì lúc điền công thức bị xô lệch
        const slot = (src, val) => `<b class="calc-slot" data-src="${src}">${'?'.repeat(String(val).length)}</b>`;
        const slotX = slot('x', x);
        const slotY = slot('y', y);

        if (x < 0.5 * y) {
            return `8 × ( ${slotX} ÷ ${slotY} )`;
        }
        if (x < 0.6 * y) {
            return `4.0 + 10 × ( ${slotX} − 0.5×${slotY} ) ÷ ${slotY}`;
        }
        return `5.0 + 12.5 × ( ${slotX} − 0.6×${slotY} ) ÷ ${slotY}`;
    }

    /**
     * Cho một con số bay từ ô này sang ô kia: nhân bản 1 span position fixed rồi transition,
     * tới nơi thì xoá bản sao và gọi onArrive để ô đích nhận số.
     */
    function flyToken(text, fromEl, toEl, delay, duration, onArrive) {
        const from = fromEl.getBoundingClientRect();
        const to = toEl.getBoundingClientRect();

        // Lớp ngoài lo chiều ngang, lớp trong lo chiều dọc — 2 nhịp khác nhau nên
        // đường bay cong mềm như ném vòng cung, thay vì kẻ thẳng đơ từ A tới B
        const ghost = document.createElement('span');
        ghost.className = 'fly-token';
        const inner = document.createElement('span');
        inner.className = 'fly-token-inner';
        inner.textContent = text;
        ghost.appendChild(inner);

        // Toạ độ tính theo trang (cộng scroll) chứ không theo màn hình,
        // để token vẫn bám đúng ô đích trong lúc trang đang trôi xuống
        ghost.style.left = `${from.left + from.width / 2 + window.scrollX}px`;
        ghost.style.top = `${from.top + from.height / 2 + window.scrollY}px`;
        ghost.style.transitionDelay = `${delay}ms`;
        ghost.style.transitionDuration = `${duration}ms`;
        inner.style.transitionDelay = `${delay}ms`;
        inner.style.transitionDuration = `${duration}ms`;
        document.body.appendChild(ghost);

        const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
        const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
        void ghost.offsetWidth; // Ép tính lại layout để transition chịu chạy
        ghost.style.transform = `translate(-50%, -50%) translateX(${dx}px)`;
        inner.style.transform = `translateY(${dy}px) scale(0.95)`;

        setTimeout(() => {
            ghost.remove();
            if (onArrive) onArrive();
        }, delay + duration);
    }

    /**
     * Lướt sao cho thấy trọn phần tử: vừa màn hình thì canh giữa,
     * cao hơn màn hình thì đưa đỉnh lên gần đầu để không bị cụt mất phần trên.
     */
    function scrollToFit(el, margin = 16) {
        const rect = el.getBoundingClientRect();
        const viewH = window.innerHeight;
        const top = rect.height <= viewH - margin * 2
            ? rect.top + window.scrollY - (viewH - rect.height) / 2
            : rect.top + window.scrollY - margin;

        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    /**
     * Thu gọn sân khấu công thức bằng max-height cho mượt, xong mới ẩn hẳn,
     * để bảng điểm trôi lên chỗ trống chứ không bị giật một phát.
     */
    function collapseStage(duration) {
        calcStage.style.maxHeight = `${calcStage.scrollHeight}px`;
        void calcStage.offsetHeight; // Chốt mốc chiều cao trước khi cho co lại
        calcStage.classList.add('collapsing');
        calcStage.style.maxHeight = '0px';

        setTimeout(() => resetStage(), duration);
    }

    // Trả sân khấu công thức về trạng thái sạch (ẩn, bỏ mọi style co giãn dở dang)
    function resetStage() {
        calcStage.hidden = true;
        calcStage.classList.remove('collapsing');
        calcStage.style.maxHeight = '';
    }

    /**
     * Màn tính điểm của chế độ hồi hộp:
     * viết công thức -> số người dùng nhập bay xuống điền vào -> công thức nhả ra điểm hệ 10
     * -> hệ 10 bay vào ô của nó -> từ hệ 10 tách tiếp ra hệ 4 và điểm chữ bay về đúng chỗ.
     */
    function runFormulaShow(x, y, score10, score4, letterGrade, token, onDone) {
        // Mọi mốc thời gian / số bay tới nơi đều bỏ qua nếu người dùng đã bấm tính lại
        const at = (ms, fn) => setTimeout(() => {
            if (token === revealToken) fn();
        }, ms);
        const guard = (fn) => () => {
            if (token === revealToken) fn();
        };

        resetStage();
        calcStage.hidden = false;
        calcFormula.classList.remove('computing');
        calcResultLine.hidden = true;
        calcResultValue.textContent = '0.00';
        calcFormula.innerHTML = formulaHtml(x, y);
        const slots = Array.from(calcFormula.querySelectorAll('.calc-slot'));

        // Ba ô kết quả để mờ, chờ số bay tới
        [resScore10, resScore4, resLetter].forEach((el) => {
            el.textContent = '?';
            el.classList.add('awaiting-value');
        });

        // 1. Màn hình bắt đầu trôi nhẹ xuống chỗ công thức, số bay theo trong lúc trang còn đang trôi
        //    (token bám toạ độ trang nên vừa cuộn vừa bay vẫn đáp đúng ô)
        at(150, () => calcStage.scrollIntoView({ behavior: 'smooth', block: 'center' }));

        const FLY_IN = 380;
        const STAGGER = 140;
        const FLIGHT = 700;
        at(FLY_IN, () => {
            slots.forEach((slot, i) => {
                const isX = slot.dataset.src === 'x';
                const val = String(isX ? x : y);
                const src = isX ? correctInput : totalInput;

                // Ô nhập nhấp nháy một cái đúng lúc con số của nó rời đi
                setTimeout(() => {
                    src.classList.add('emitting');
                    setTimeout(() => src.classList.remove('emitting'), 500);
                }, i * STAGGER);

                flyToken(val, src, slot, i * STAGGER, FLIGHT, guard(() => {
                    slot.textContent = val;
                    slot.classList.add('filled');
                }));
            });
        });

        // 2. Số đã xuống hết công thức -> lướt sao cho thấy trọn bảng kết quả rồi mới bấm máy
        const filled = FLY_IN + (slots.length - 1) * STAGGER + FLIGHT;
        at(filled + 120, () => scrollToFit(resultsContainer));
        at(filled + 220, () => calcFormula.classList.add('computing'));
        at(filled + 620, () => {
            calcFormula.classList.remove('computing');
            calcResultLine.hidden = false;
            revealChars(calcResultValue, score10.toFixed(2), 320, 85, token);
        });

        // 3. Điểm hệ 10 nảy một cái rồi bay từ công thức vào đúng ô của nó
        const s10Ready = filled + 620 + 320 + 3 * 85 + 260;
        at(s10Ready - 200, () => calcResultValue.classList.add('value-pulse'));
        at(s10Ready, () => {
            calcResultValue.classList.remove('value-pulse');
            flyToken(score10.toFixed(2), calcResultValue, resScore10, 0, 700, guard(() => {
                resScore10.classList.remove('awaiting-value');
                revealChars(resScore10, score10.toFixed(2), 180, 90, token);
            }));
        });

        // 4. Công thức xong việc thì thu gọn lại, nhường chỗ cho bảng điểm trôi lên,
        //    rồi canh lại khung hình vì bảng vừa ngắn đi một khúc
        const collapse = s10Ready + 850;
        at(collapse, () => collapseStage(600));
        at(collapse + 620, () => scrollToFit(resultsContainer));

        // 5. Layout đứng yên rồi mới tách: hệ 10 nhân ra 2 BẢN SAO của chính nó,
        //    một bản bay sang ô điểm chữ, một bản bay lên ô hệ 4 (chưa đổi giá trị vội)
        const split = collapse + 950;
        const LETTER_FLIGHT = 680;
        const SCORE4_FLIGHT = 820;
        const copy = score10.toFixed(2);
        at(split - 250, () => resScore10.classList.add('value-pulse'));
        at(split, () => {
            resScore10.classList.remove('value-pulse');
            flyToken(copy, resScore10, resLetter, 0, LETTER_FLIGHT, guard(() => {
                resLetter.classList.remove('awaiting-value');
                resLetter.textContent = copy;
                resLetter.classList.add('just-copied');
            }));
            flyToken(copy, resScore10, resScore4, 0, SCORE4_FLIGHT, guard(() => {
                resScore4.classList.remove('awaiting-value');
                resScore4.textContent = copy;
                resScore4.classList.add('just-copied');
            }));
        });

        // 6. Bản sao đáp xuống rồi mới quay số biến thành giá trị thật — điểm chữ đi trước
        const letterMorph = split + LETTER_FLIGHT + 140;
        at(letterMorph, () => {
            resLetter.classList.remove('just-copied');
            revealChars(resLetter, letterGrade, 300, 100, token);
        });

        // 7. Điểm chữ chốt xong mới tới lượt hệ 4 quay số (ký tự cuối khoá + nhịp rơi 420ms)
        const letterDone = letterMorph + 300 + (letterGrade.length - 1) * 100 + 420;
        const score4Morph = letterDone + 160;
        at(score4Morph, () => {
            resScore4.classList.remove('just-copied');
            revealChars(resScore4, score4.toFixed(2), 380, 120, token);
        });

        // 8. Hệ 4 vừa chốt là đóng mộc cái đùng, xong mới tới phần lời nhắn
        const score4Done = score4Morph + 380 + 3 * 120 + 380;
        at(score4Done, () => {
            resScore4.classList.remove('stamp-hit');
            mainResultCard.classList.remove('stamped');
            void resScore4.offsetWidth; // Reflow để đóng mộc lại được từ đầu ở lượt tính sau
            resScore4.classList.add('stamp-hit');
            mainResultCard.classList.add('stamped');
        });

        at(score4Done + 520, () => {
            resetStage();
            onDone();
        });
    }

    // Ký tự thay thế lúc đang quay: số ngẫu nhiên cho chữ số, chữ ngẫu nhiên cho điểm chữ, còn lại (., +) giữ nguyên
    function randomizeChar(c) {
        if (/[0-9]/.test(c)) return String(Math.floor(Math.random() * 10));
        if (/[A-Z]/.test(c)) return 'ABCDF'[Math.floor(Math.random() * 5)];
        return c;
    }

    /**
     * Quay số kiểu máy xèng theo từng ký tự: mọi ô cùng nhảy loạn xạ, rồi khoá cứng
     * lần lượt từ trái qua phải (mỗi ô cách nhau lockStagger ms) với hiệu ứng rơi mạnh.
     */
    function revealChars(el, finalText, scrambleMs, lockStagger, token, onDone) {
        const chars = finalText.split('');
        // Khởi tạo bằng ký tự ngẫu nhiên luôn, không thì có 1 frame lộ đáp án trước khi quay
        el.innerHTML = chars
            .map((c) => `<span class="digit-cell${/[0-9A-Z]/.test(c) ? '' : ' is-punct'}">${randomizeChar(c)}</span>`)
            .join('');
        const cells = Array.from(el.children);
        const startTime = performance.now();
        let lastTick = 0;

        const step = (now) => {
            if (token !== revealToken) return; // đã bấm tính lại -> bỏ lượt quay cũ
            const elapsed = now - startTime;
            const shouldTick = elapsed - lastTick >= 55;

            cells.forEach((cell, i) => {
                if (cell.dataset.locked) return;
                if (elapsed >= scrambleMs + i * lockStagger) {
                    cell.textContent = chars[i];
                    cell.dataset.locked = '1';
                    cell.classList.add('digit-drop');
                } else if (shouldTick) {
                    cell.textContent = randomizeChar(chars[i]);
                }
            });
            if (shouldTick) lastTick = elapsed;

            if (cells.some((c) => !c.dataset.locked)) {
                window.requestAnimationFrame(step);
            } else if (onDone) {
                onDone();
            }
        };
        window.requestAnimationFrame(step);
    }

    /**
     * Hàm bắn pháo giấy (confetti)
     */
    function triggerConfetti() {
        const duration = 2000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: ['#ff8e9e', '#7db9f7', '#ffd700']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: ['#ff8e9e', '#7db9f7', '#ffd700']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
});

/* ====================================================
   PWA - CÀI APP VỀ ĐIỆN THOẠI + DÙNG OFFLINE
   ==================================================== */
(function initInstallApp() {
    // Đăng ký service worker (bắt buộc để cài được + chạy offline)
    if ('serviceWorker' in navigator) {
        // Khi deploy bản mới, service worker mới sẽ chiếm quyền.
        // Lúc đó tự tải lại trang 1 lần để không bị kẹt ở bản cũ.
        // daCoSW: lần đầu cài thì không reload, tránh chớp trang vô ích.
        const daCoSW = !!navigator.serviceWorker.controller;
        let dangTaiLai = false;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (!daCoSW || dangTaiLai) return;
            dangTaiLai = true;
            location.reload();
        });

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
