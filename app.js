(function () {
  var DESIGN_WIDTH = 252;
  var DESIGN_HEIGHT = 420;
  var USERS_KEY = "sansu_users";
  var WRONG_PROBLEMS_KEY = "sansu_wrong_problems";
  var STATS_KEY = "sansu_quiz_stats";
  var MASTER_ACCOUNT = {
    name: "redwaterdeer",
    password: "10qp29wo!Q",
    age: 1,
    motto: "",
    isMaster: true
  };
  var ageValue = 1;

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function ensureMasterAccount() {
    var users = getUsers();
    var masterIndex = users.findIndex(function (item) {
      return item.name === MASTER_ACCOUNT.name;
    });

    if (masterIndex === -1) {
      users.push({
        name: MASTER_ACCOUNT.name,
        password: MASTER_ACCOUNT.password,
        age: MASTER_ACCOUNT.age,
        motto: MASTER_ACCOUNT.motto,
        isMaster: true
      });
      saveUsers(users);
      return;
    }

    users[masterIndex] = {
      name: MASTER_ACCOUNT.name,
      password: MASTER_ACCOUNT.password,
      age: users[masterIndex].age || MASTER_ACCOUNT.age,
      motto: users[masterIndex].motto || MASTER_ACCOUNT.motto,
      isMaster: true
    };
    saveUsers(users);
  }

  function isMasterLogin(name, password) {
    return name === MASTER_ACCOUNT.name && password === MASTER_ACCOUNT.password;
  }

  function showScreen(screenId) {
    var screens = document.querySelectorAll(".phone");
    screens.forEach(function (screen) {
      var isTarget = screen.id === screenId;
      screen.classList.toggle("phone--hidden", !isTarget);
      screen.hidden = !isTarget;
    });
    if (screenId !== "screen-1") {
      resetLoginKeyboardLift(false);
    }
    updatePhoneScale();
  }

  function goToLoginScreen() {
    loginForm.reset();
    currentUserName = "";
    isCurrentUserMaster = false;
    updateScreen2Exit();
    showScreen("screen-1");
  }

  function goToHomeScreen() {
    resetMenuTransition();
    updateScreen2Exit();
    showScreen("screen-2");
  }

  var menuTransitionActive = false;

  function resetMenuTransition() {
    var items = document.querySelectorAll("#screen-2 .menu-item");
    var i;

    menuTransitionActive = false;

    for (i = 0; i < items.length; i += 1) {
      items[i].classList.remove("menu-item--dimmed", "menu-item--selected");
      items[i].disabled = false;
    }
  }

  function playMenuTransition(selectedBtn, callback) {
    var items = document.querySelectorAll("#screen-2 .menu-item");
    var i;

    if (menuTransitionActive) {
      return;
    }

    menuTransitionActive = true;

    for (i = 0; i < items.length; i += 1) {
      if (items[i] === selectedBtn) {
        items[i].classList.add("menu-item--selected");
      } else {
        items[i].classList.add("menu-item--dimmed");
      }
      items[i].disabled = true;
    }

    setTimeout(function () {
      resetMenuTransition();
      callback();
    }, 500);
  }

  function updateScreen2Exit() {
    var divider = document.getElementById("screen-2-admin-divider");
    var adminButton = document.getElementById("admin-btn");
    var showAdmin = isCurrentUserMaster;

    divider.hidden = !showAdmin;
    divider.setAttribute("aria-hidden", showAdmin ? "false" : "true");
    adminButton.hidden = !showAdmin;
  }

  function getAdminUsers() {
    return getUsers().filter(function (user) {
      return !user.isMaster && user.name !== MASTER_ACCOUNT.name;
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderAdminTable() {
    var tbody = document.getElementById("admin-table-body");
    var users = getAdminUsers();
    var i;
    var row;
    var user;

    tbody.innerHTML = "";

    var rowCount = Math.max(ADMIN_ROW_COUNT, users.length);

    for (i = 0; i < rowCount; i += 1) {
      user = users[i];
      row = document.createElement("tr");

      if (user) {
        row.dataset.originalName = user.name;
      }

      row.innerHTML =
        "<td>" +
        String(i + 1).padStart(2, "0") +
        "</td><td><input class=\"admin-input admin-name\" type=\"text\" value=\"" +
        escapeHtml(user ? user.name : "") +
        "\"></td><td><input class=\"admin-input admin-password\" type=\"text\" value=\"" +
        escapeHtml(user ? user.password : "") +
        "\"></td><td><input class=\"admin-delete\" type=\"checkbox\"></td>";
      tbody.appendChild(row);
    }
  }

  function openAdminScreen() {
    if (!isCurrentUserMaster) {
      return;
    }

    renderAdminTable();
    showScreen("screen-admin");
  }

  function saveAdminUsers() {
    var rows = document.querySelectorAll("#admin-table-body tr");
    var existingUsers = getUsers();
    var keptUsers = existingUsers.filter(function (user) {
      return user.isMaster || user.name === MASTER_ACCOUNT.name;
    });
    var usedNames = {};
    var i;
    var row;
    var name;
    var password;
    var originalName;
    var existing;
    var deleteInput;

    for (i = 0; i < rows.length; i += 1) {
      row = rows[i];
      deleteInput = row.querySelector(".admin-delete");

      if (deleteInput.checked) {
        continue;
      }

      name = row.querySelector(".admin-name").value.trim();
      password = row.querySelector(".admin-password").value.trim();
      originalName = row.dataset.originalName || "";

      if (!name) {
        continue;
      }

      if (name === MASTER_ACCOUNT.name) {
        continue;
      }

      if (usedNames[name]) {
        continue;
      }

      existing = existingUsers.find(function (user) {
        return user.name === originalName;
      });

      if (!existing) {
        existing = existingUsers.find(function (user) {
          return user.name === name;
        });
      }

      keptUsers.push({
        name: name,
        password: password || (existing ? existing.password : ""),
        age: existing ? existing.age : 1,
        motto: existing ? existing.motto : ""
      });
      usedNames[name] = true;
    }

    saveUsers(keptUsers);
    ensureMasterAccount();
    alert("저장되었습니다.");
    showScreen("screen-2");
  }

  var loginKeyboardLock = false;
  var lockedPhoneScale = null;

  function isScreen1Visible() {
    var screen1 = document.getElementById("screen-1");
    return screen1 && !screen1.hidden;
  }

  function isLoginInput(element) {
    return (
      element &&
      loginForm &&
      loginForm.contains(element) &&
      (element.name === "name" || element.name === "password")
    );
  }

  function resetLoginKeyboardLift(shouldUpdateScale) {
    loginKeyboardLock = false;
    lockedPhoneScale = null;
    document.documentElement.style.setProperty("--phone-lift", "0px");
    if (shouldUpdateScale !== false) {
      updatePhoneScale();
    }
  }

  function alignLoginFieldForKeyboard() {
    var viewport = window.visualViewport;
    var active = document.activeElement;

    if (!loginKeyboardLock || !viewport || !isLoginInput(active)) {
      return;
    }

    var field = active.closest(".field");
    if (!field) {
      return;
    }

    var fieldRect = field.getBoundingClientRect();
    var visibleTop = viewport.offsetTop;
    var visibleBottom = viewport.offsetTop + viewport.height;
    var padding = 14;
    var lift = 0;

    if (fieldRect.bottom > visibleBottom - padding) {
      lift = fieldRect.bottom - visibleBottom + padding;
    } else if (fieldRect.top < visibleTop + padding) {
      lift = -(padding - (fieldRect.top - visibleTop));
    }

    document.documentElement.style.setProperty("--phone-lift", Math.max(0, lift) + "px");
  }

  function getAvailableViewport() {
    var vv = window.visualViewport;
    var width = window.innerWidth;
    var height = window.innerHeight;
    var clientW = document.documentElement.clientWidth;
    var clientH = document.documentElement.clientHeight;

    if (vv) {
      width = Math.min(width, vv.width);
      height = Math.min(height, vv.height);
    }
    if (clientW > 0) {
      width = Math.min(width, clientW);
    }
    if (clientH > 0) {
      height = Math.min(height, clientH);
    }

    return {
      width: width,
      height: height
    };
  }

  function updatePhoneScale() {
    var viewport = getAvailableViewport();
    var safeInset = 2;
    var scale;

    if (loginKeyboardLock && lockedPhoneScale !== null) {
      document.documentElement.style.setProperty("--phone-scale", String(lockedPhoneScale));
      alignLoginFieldForKeyboard();
      return;
    }

    scale = Math.min(
      (viewport.width - safeInset) / DESIGN_WIDTH,
      (viewport.height - safeInset) / DESIGN_HEIGHT
    );
    if (!isFinite(scale) || scale <= 0) {
      scale = 1;
    }

    document.documentElement.style.setProperty("--phone-scale", String(scale));
    refitVisibleQuizGrids();
  }

  function refitVisibleQuizGrids() {
    var gridIds = ["quiz-problem-grid", "quiz-wrong-grid", "quiz-correct-grid"];
    var i;
    var grid;

    for (i = 0; i < gridIds.length; i += 1) {
      grid = document.getElementById(gridIds[i]);
      if (grid && grid.offsetParent !== null) {
        fitQuizProblemGrid(gridIds[i]);
      }
    }
  }

  function lockPageScroll() {
    if (loginKeyboardLock) {
      return;
    }
    window.scrollTo(0, 0);
  }

  function setupLoginKeyboardLift() {
    var inputs = loginForm.querySelectorAll('input[name="name"], input[name="password"]');

    inputs.forEach(function (input) {
      input.addEventListener("focus", function () {
        if (!isScreen1Visible()) {
          return;
        }

        loginKeyboardLock = true;
        lockedPhoneScale =
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--phone-scale")
          ) || 1;

        requestAnimationFrame(function () {
          requestAnimationFrame(alignLoginFieldForKeyboard);
        });
      });

      input.addEventListener("blur", function () {
        setTimeout(function () {
          if (isLoginInput(document.activeElement)) {
            alignLoginFieldForKeyboard();
            return;
          }
          resetLoginKeyboardLift();
        }, 80);
      });
    });
  }

  function updateAgeDisplay() {
    document.getElementById("age-display").textContent = ageValue + "살";
  }

  function resetSignupForm() {
    var signupForm = document.getElementById("signup-form");
    signupForm.reset();
    ageValue = 1;
    updateAgeDisplay();
  }

  window.addEventListener("resize", function () {
    updatePhoneScale();
    lockPageScroll();
  });
  window.addEventListener("orientationchange", function () {
    updatePhoneScale();
    lockPageScroll();
  });
  window.addEventListener("scroll", lockPageScroll, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", function () {
      updatePhoneScale();
      if (!loginKeyboardLock) {
        lockPageScroll();
      }
    });
    window.visualViewport.addEventListener("scroll", function () {
      if (loginKeyboardLock) {
        alignLoginFieldForKeyboard();
        return;
      }
      lockPageScroll();
    }, { passive: true });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updatePhoneScale);
  }

  var loginForm = document.getElementById("login-form");

  updatePhoneScale();
  ensureMasterAccount();
  setupLoginKeyboardLift();

  var signupLink = document.getElementById("signup-link");
  var loginLink = document.getElementById("login-link");
  var exitBtn = document.getElementById("exit-btn");
  var adminBtn = document.getElementById("admin-btn");
  var adminExitBtn = document.getElementById("admin-exit-btn");
  var adminSaveBtn = document.getElementById("admin-save-btn");
  var menuNewBtn = document.getElementById("menu-new");
  var menuWrongBtn = document.getElementById("menu-wrong");
  var menuStatsBtn = document.getElementById("menu-stats");
  var pickPlusBtn = document.getElementById("pick-plus");
  var pickMinusBtn = document.getElementById("pick-minus");
  var pickMultiplyBtn = document.getElementById("pick-multiply");
  var pickDivideBtn = document.getElementById("pick-divide");
  var signupForm = document.getElementById("signup-form");
  var signupExitBtn = document.getElementById("signup-exit-btn");
  var ageUpBtn = document.getElementById("age-up");
  var ageDownBtn = document.getElementById("age-down");
  var lastOpScreen = "screen-add";
  var DIFFICULTY_SCREENS = [
    "screen-diff-1",
    "screen-diff-2",
    "screen-diff-3",
    "screen-diff-4"
  ];
  var lastDiffScreen = "screen-diff-1";
  var quizMode = "new";
  var currentUserName = "";
  var isCurrentUserMaster = false;
  var ADMIN_ROW_COUNT = 12;
  var currentQuizAnswer = 0;
  var currentQuizState = {
    a: 0,
    b: 0,
    digits: 1,
    cols: 1,
    opScreen: "screen-add",
    opSymbol: "+",
    title: "",
    charSrc: "",
    answerSlots: [],
    divisionLayout: null,
    problem: null
  };
  var QUIZ_BADGE_IMAGES = {
    fighting: "https://i.ibb.co/FLGPW7C5/image.png",
    retry: "https://i.ibb.co/mrzhsPyy/image.png",
    good: "https://i.ibb.co/LdLKjWRR/good.png"
  };
  var DIVIDE_LAYOUT = {
    side: 22,
    bracket: 18,
    cell: 26,
    gap: 3
  };
  var quizProblemNumber = 1;
  var OP_CHARACTERS = {
    "screen-add": "https://i.ibb.co/qYQ06W3T/image.png",
    "screen-subtract": "https://i.ibb.co/9mgD8pS7/image.png",
    "screen-multiply": "https://i.ibb.co/NdGcYndr/image.png",
    "screen-divide": "https://i.ibb.co/LDZKNNLF/image.png"
  };
  var OP_LABELS = {
    "screen-add": "덧셈",
    "screen-subtract": "뺄셈",
    "screen-multiply": "곱셈",
    "screen-divide": "나눗셈"
  };
  var OP_SYMBOLS = {
    "screen-add": "+",
    "screen-subtract": "-",
    "screen-multiply": "×",
    "screen-divide": "÷"
  };

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getAllWrongProblemsStore() {
    try {
      var raw = JSON.parse(localStorage.getItem(WRONG_PROBLEMS_KEY) || "{}");

      if (Array.isArray(raw)) {
        return {};
      }

      return raw;
    } catch (error) {
      return {};
    }
  }

  function getWrongProblems() {
    if (!currentUserName) {
      return [];
    }

    var store = getAllWrongProblemsStore();
    return store[currentUserName] || [];
  }

  function saveWrongProblems(problems) {
    if (!currentUserName) {
      return;
    }

    var store = getAllWrongProblemsStore();
    store[currentUserName] = problems;
    localStorage.setItem(WRONG_PROBLEMS_KEY, JSON.stringify(store));
  }

  function getProblemKey(opScreen, digits, problem) {
    if (opScreen === "screen-divide") {
      return opScreen + "|" + digits + "|" + problem.dividend + "|" + problem.divisor;
    }

    return opScreen + "|" + digits + "|" + problem.a + "|" + problem.b;
  }

  function captureProblemSnapshot(opScreen, problem) {
    if (opScreen === "screen-divide") {
      return {
        dividend: problem.dividend,
        divisor: problem.divisor,
        quotient: problem.quotient,
        remainder: problem.remainder
      };
    }

    if (opScreen === "screen-multiply") {
      return {
        a: problem.a,
        b: problem.b,
        product: problem.product,
        cols: problem.cols
      };
    }

    if (opScreen === "screen-subtract") {
      return {
        a: problem.a,
        b: problem.b,
        diff: problem.diff
      };
    }

    return {
      a: problem.a,
      b: problem.b,
      sum: problem.sum
    };
  }

  function addWrongProblem(opScreen, digits, problem) {
    if (!currentUserName) {
      return;
    }

    var snapshot = captureProblemSnapshot(opScreen, problem);
    var key = getProblemKey(opScreen, digits, snapshot);
    var problems = getWrongProblems();
    var i;

    for (i = 0; i < problems.length; i += 1) {
      if (problems[i].key === key) {
        return;
      }
    }

    problems.push({
      key: key,
      opScreen: opScreen,
      digits: digits,
      problem: snapshot
    });
    saveWrongProblems(problems);
  }

  function removeWrongProblem(opScreen, digits, problem) {
    var key = getProblemKey(opScreen, digits, problem);
    var problems = getWrongProblems().filter(function (item) {
      return item.key !== key;
    });

    saveWrongProblems(problems);
  }

  function getWrongProblemsForQuiz(opScreen, digits) {
    return getWrongProblems().filter(function (item) {
      return item.opScreen === opScreen && item.digits === digits;
    });
  }

  function hasWrongProblemsForDigits(opScreen, digits) {
    return getWrongProblemsForQuiz(opScreen, digits).length > 0;
  }

  function resetDifficultyPickVisibility() {
    document
      .querySelectorAll(
        "#screen-difficulty .pick-item[data-difficulty], [id^='screen-diff-'] .pick-item[data-diff-screen]"
      )
      .forEach(function (btn) {
        btn.hidden = false;
        btn.classList.remove("pick-item--empty");
      });

    document.querySelectorAll("#screen-diff-1 .go-btn, #screen-diff-2 .go-btn, #screen-diff-3 .go-btn, #screen-diff-4 .go-btn").forEach(function (btn) {
      btn.hidden = false;
    });
  }

  function updateWrongDifficultyVisibility(opScreen) {
    var availableDigits = [];
    var i;

    if (quizMode !== "wrong") {
      resetDifficultyPickVisibility();
      return availableDigits;
    }

    for (i = 1; i <= 4; i += 1) {
      if (hasWrongProblemsForDigits(opScreen, i)) {
        availableDigits.push(i);
      }
    }

    document.querySelectorAll("#screen-difficulty .pick-item[data-difficulty]").forEach(function (btn) {
      var digits = parseInt(btn.getAttribute("data-difficulty"), 10);
      var isAvailable = availableDigits.indexOf(digits) !== -1;

      btn.hidden = !isAvailable;
      btn.classList.toggle("pick-item--empty", !isAvailable);
    });

    document.querySelectorAll("[id^='screen-diff-'] .pick-item[data-diff-screen]").forEach(function (btn) {
      var digits = parseInt(btn.getAttribute("data-diff-screen").replace("screen-diff-", ""), 10);
      var isAvailable = availableDigits.indexOf(digits) !== -1;

      btn.hidden = !isAvailable;
      btn.classList.toggle("pick-item--empty", !isAvailable);
    });

    document.querySelectorAll("#screen-diff-1 .go-btn, #screen-diff-2 .go-btn, #screen-diff-3 .go-btn, #screen-diff-4 .go-btn").forEach(function (btn) {
      var screen = btn.closest(".phone");
      var digits = screen ? parseInt(screen.id.replace("screen-diff-", ""), 10) : 0;

      btn.hidden = availableDigits.indexOf(digits) === -1;
    });

    return availableDigits;
  }

  function getAllQuizAttempts() {
    try {
      return JSON.parse(localStorage.getItem(STATS_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveAllQuizAttempts(attempts) {
    localStorage.setItem(STATS_KEY, JSON.stringify(attempts));
  }

  function recordQuizAttempt(opScreen, digits, isCorrect) {
    if (!currentUserName) {
      return;
    }

    var now = new Date();
    var attempts = getAllQuizAttempts();

    attempts.push({
      userName: currentUserName,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      opScreen: opScreen,
      digits: digits,
      isCorrect: isCorrect
    });
    saveAllQuizAttempts(attempts);
  }

  function getStatsFilters() {
    var digitsValue = document.getElementById("stats-digits").value;

    return {
      year: parseInt(document.getElementById("stats-year").value, 10),
      month: document.getElementById("stats-month").value,
      opScreen: document.getElementById("stats-op").value,
      digits: digitsValue === "all" ? "all" : parseInt(digitsValue, 10)
    };
  }

  function filterQuizAttempts(filters) {
    return getAllQuizAttempts().filter(function (item) {
      if (item.userName !== currentUserName) {
        return false;
      }

      if (item.year !== filters.year) {
        return false;
      }

      if (item.opScreen !== filters.opScreen) {
        return false;
      }

      if (filters.digits !== "all" && item.digits !== filters.digits) {
        return false;
      }

      if (filters.month !== "all" && item.month !== parseInt(filters.month, 10)) {
        return false;
      }

      return true;
    });
  }

  function buildMonthlyStats(attempts) {
    var monthly = [];
    var i;
    var monthAttempts;
    var total;
    var correct;

    for (i = 1; i <= 12; i += 1) {
      monthAttempts = attempts.filter(function (item) {
        return item.month === i;
      });
      total = monthAttempts.length;
      correct = monthAttempts.filter(function (item) {
        return item.isCorrect;
      }).length;
      monthly.push({
        month: i,
        total: total,
        correct: correct
      });
    }

    return monthly;
  }

  function formatRate(correct, total) {
    if (!total) {
      return "-";
    }

    return Math.round((correct / total) * 100) + "%";
  }

  function formatMonthLabel(month) {
    return String(month).padStart(2, "0") + "월";
  }

  function formatDayLabel(day) {
    return String(day).padStart(2, "0") + "일";
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function buildDailyStats(attempts, year, month) {
    var daysInMonth = getDaysInMonth(year, month);
    var daily = [];
    var day;
    var dayAttempts;

    for (day = 1; day <= daysInMonth; day += 1) {
      dayAttempts = attempts.filter(function (item) {
        return item.day === day;
      });
      daily.push({
        day: day,
        total: dayAttempts.length,
        correct: dayAttempts.filter(function (item) {
          return item.isCorrect;
        }).length
      });
    }

    return daily;
  }

  function renderStatsChart(monthly, monthFilter) {
    var chartBars = document.getElementById("stats-chart-bars");
    var chartX = document.getElementById("stats-chart-x");
    var maxScale = 50;
    var i;
    var item;
    var col;
    var stack;
    var wrongBar;
    var correctBar;
    var totalHeight;
    var correctHeight;
    var wrongHeight;
    var xLabel;

    chartBars.innerHTML = "";
    chartX.innerHTML = "";

    for (i = 0; i < monthly.length; i += 1) {
      item = monthly[i];
      col = document.createElement("div");
      col.className = "stats-bar-col";
      stack = document.createElement("div");
      stack.className = "stats-bar-stack";

      if (monthFilter !== "all" && String(item.month) !== monthFilter) {
        item = { month: item.month, total: 0, correct: 0 };
      }

      totalHeight = Math.round((item.total / maxScale) * 66);
      correctHeight = item.total ? Math.round((item.correct / item.total) * totalHeight) : 0;
      wrongHeight = Math.max(0, totalHeight - correctHeight);

      wrongBar = document.createElement("div");
      wrongBar.className = "stats-bar-wrong";
      wrongBar.style.height = wrongHeight + "px";

      correctBar = document.createElement("div");
      correctBar.className = "stats-bar-correct";
      correctBar.style.height = correctHeight + "px";

      stack.appendChild(wrongBar);
      stack.appendChild(correctBar);
      col.appendChild(stack);
      chartBars.appendChild(col);

      xLabel = document.createElement("span");
      xLabel.textContent = item.month + "월";
      chartX.appendChild(xLabel);
    }
  }

  function renderStatsTable(attempts, monthFilter, year) {
    var tbody = document.getElementById("stats-table-body");
    var monthly = buildMonthlyStats(attempts);
    var totalAll = attempts.length;
    var correctAll = attempts.filter(function (item) {
      return item.isCorrect;
    }).length;
    var daily;
    var i;
    var item;
    var row;

    tbody.innerHTML = "";

    row = document.createElement("tr");
    row.className = "stats-row-cumulative";
    row.innerHTML =
      "<td>누적</td><td>" +
      totalAll +
      "</td><td>" +
      correctAll +
      "</td><td>" +
      formatRate(correctAll, totalAll) +
      "</td>";
    tbody.appendChild(row);

    if (monthFilter === "all") {
      for (i = 0; i < monthly.length; i += 1) {
        item = monthly[i];
        row = document.createElement("tr");
        row.innerHTML =
          "<td>" +
          formatMonthLabel(item.month) +
          "</td><td>" +
          (item.total || "") +
          "</td><td>" +
          (item.correct || "") +
          "</td><td>" +
          (item.total ? formatRate(item.correct, item.total) : "") +
          "</td>";
        tbody.appendChild(row);
      }
      return;
    }

    daily = buildDailyStats(attempts, year, parseInt(monthFilter, 10));
    for (i = 0; i < daily.length; i += 1) {
      item = daily[i];
      row = document.createElement("tr");
      row.innerHTML =
        "<td>" +
        formatDayLabel(item.day) +
        "</td><td>" +
        (item.total || "") +
        "</td><td>" +
        (item.correct || "") +
        "</td><td>" +
        (item.total ? formatRate(item.correct, item.total) : "") +
        "</td>";
      tbody.appendChild(row);
    }
  }

  function renderStatsScreen() {
    var filters = getStatsFilters();
    var attempts = filterQuizAttempts(filters);
    var chartAttempts;
    var monthlyForChart;

    if (filters.month === "all") {
      chartAttempts = attempts;
    } else {
      chartAttempts = filterQuizAttempts({
        year: filters.year,
        month: "all",
        opScreen: filters.opScreen,
        digits: filters.digits
      });
    }

    monthlyForChart = buildMonthlyStats(chartAttempts);
    renderStatsChart(monthlyForChart, filters.month);
    renderStatsTable(attempts, filters.month, filters.year);
  }

  function populateStatsYearOptions() {
    var yearSelect = document.getElementById("stats-year");
    var currentYear = new Date().getFullYear();
    var years = {};
    var yearList = [currentYear];
    var attempts = getAllQuizAttempts();
    var i;

    for (i = 0; i < attempts.length; i += 1) {
      if (attempts[i].userName === currentUserName) {
        years[attempts[i].year] = true;
      }
    }

    Object.keys(years).forEach(function (year) {
      yearList.push(parseInt(year, 10));
    });

    yearList = yearList.filter(function (year, index, list) {
      return list.indexOf(year) === index;
    }).sort(function (a, b) {
      return b - a;
    });

    yearSelect.innerHTML = "";
    yearList.forEach(function (year) {
      var option = document.createElement("option");
      option.value = String(year);
      option.textContent = year + "년";
      yearSelect.appendChild(option);
    });
    refreshCustomSelect(yearSelect);
  }

  function openStatsScreen() {
    if (!currentUserName) {
      alert("로그인 후 이용해 주세요.");
      return;
    }

    populateStatsYearOptions();
    document.getElementById("stats-month").value = "all";
    document.getElementById("stats-op").value = "screen-add";
    document.getElementById("stats-digits").value = "4";
    renderStatsScreen();
    showScreen("screen-stats");
  }

  function initStatsScreen() {
    var filterIds = ["stats-year", "stats-month", "stats-op", "stats-digits"];
    var i;

    enhanceStatsSelects();

    for (i = 0; i < filterIds.length; i += 1) {
      document.getElementById(filterIds[i]).addEventListener("change", renderStatsScreen);
    }
  }

  function generateAdditionProblem(digits) {
    var sum;
    var a;
    var b;

    if (digits === 1) {
      a = randomInt(1, 8);
      b = randomInt(1, 9 - a);
    } else if (digits === 2) {
      sum = randomInt(10, 99);
      a = randomInt(1, sum - 1);
      b = sum - a;
    } else if (digits === 3) {
      sum = randomInt(100, 999);
      a = randomInt(10, sum - 10);
      b = sum - a;
    } else {
      sum = randomInt(1000, 9999);
      a = randomInt(100, sum - 100);
      b = sum - a;
    }

    return { a: a, b: b, sum: a + b };
  }

  function generateSubtractionProblem(digits) {
    var a;
    var b;

    if (digits === 1) {
      a = randomInt(2, 9);
      b = randomInt(1, a - 1);
    } else if (digits === 2) {
      a = randomInt(20, 99);
      b = randomInt(10, a - 1);
    } else if (digits === 3) {
      a = randomInt(200, 999);
      b = randomInt(100, a - 1);
    } else {
      a = randomInt(2000, 9999);
      b = randomInt(1000, a - 1);
    }

    return { a: a, b: b, diff: a - b };
  }

  function generateMultiplicationProblem(digits) {
    var a;
    var b;
    var product;
    var cols;

    if (digits === 1) {
      a = randomInt(2, 9);
      b = randomInt(2, 9);
      product = a * b;
      cols = Math.max(2, String(product).length);
    } else if (digits === 2) {
      a = randomInt(10, 99);
      b = randomInt(10, 99);
      product = a * b;
      cols = Math.max(3, String(product).length);
    } else if (digits === 3) {
      a = randomInt(10, 99);
      b = randomInt(10, 30);
      product = a * b;
      cols = 3;
    } else {
      a = randomInt(100, 999);
      b = randomInt(10, 99);
      product = a * b;
      cols = Math.max(4, String(product).length);
    }

    cols = Math.max(cols, String(product).length);

    return { a: a, b: b, product: product, cols: cols };
  }

  function generateDivisionProblem(digits) {
    var divisor;
    var quotient;
    var dividend;
    var attempts = 0;

    while (attempts < 40) {
      attempts += 1;

      if (digits === 1) {
        divisor = randomInt(2, 9);
        quotient = randomInt(2, 9);
      } else if (digits === 2) {
        divisor = randomInt(2, 12);
        quotient = randomInt(10, 99);
      } else if (digits === 3) {
        divisor = randomInt(2, 9);
        quotient = randomInt(100, 999);
      } else {
        divisor = randomInt(2, 12);
        quotient = randomInt(1000, 9999);
      }

      dividend = divisor * quotient;

      if (String(quotient).length === digits && String(dividend).length >= digits) {
        return {
          dividend: dividend,
          divisor: divisor,
          quotient: quotient,
          remainder: 0
        };
      }
    }

    divisor = 7;
    quotient = 235;
    dividend = 1645;

    return {
      dividend: dividend,
      divisor: divisor,
      quotient: quotient,
      remainder: 0
    };
  }

  function computeDivisionSteps(dividend, divisor) {
    var dividendStr = String(dividend);
    var steps = [];
    var remainder = 0;
    var quotient = "";
    var i;
    var digit;
    var q;
    var product;
    var partialStr;

    for (i = 0; i < dividendStr.length; i += 1) {
      digit = parseInt(dividendStr[i], 10);
      remainder = remainder * 10 + digit;

      if (quotient.length === 0 && remainder < divisor) {
        continue;
      }

      q = Math.floor(remainder / divisor);
      product = q * divisor;
      partialStr = String(remainder);

      steps.push({
        partial: remainder,
        quotientDigit: q,
        product: product,
        partialStartCol: i - partialStr.length + 1
      });

      remainder -= product;
      quotient += String(q);
    }

    return {
      steps: steps,
      quotient: parseInt(quotient, 10),
      remainder: remainder
    };
  }

  function getStepProductStartCol(step) {
    var partialLen = String(step.partial).length;
    var productLen = String(step.product).length;

    return step.partialStartCol + partialLen - productLen;
  }

  function buildDivisionAnswerSlots(steps) {
    var slots = [];
    var i;
    var j;

    for (i = 0; i < steps.length; i += 1) {
      slots.push(String(steps[i].quotientDigit));
    }

    for (i = 0; i < steps.length; i += 1) {
      String(steps[i].product).split("").forEach(function (digit) {
        slots.push(digit);
      });

      if (i < steps.length - 1) {
        String(steps[i + 1].partial).split("").forEach(function (digit) {
          slots.push(digit);
        });
      }
    }

    return slots;
  }

  function buildDivisionLayout(dividend, divisor) {
    var dividendStr = String(dividend);
    var cols = dividendStr.length;
    var result = computeDivisionSteps(dividend, divisor);
    var quotientStr = String(result.quotient);
    var quotientStartCol = cols - quotientStr.length;
    var rows = [];
    var i;

    rows.push({
      type: "quotient",
      startCol: quotientStartCol,
      digits: quotientStr.split("")
    });

    rows.push({
      type: "dividend",
      divisor: String(divisor),
      digits: dividendStr.split("")
    });

    for (i = 0; i < result.steps.length; i += 1) {
      rows.push({
        type: "product",
        startCol: getStepProductStartCol(result.steps[i]),
        digits: String(result.steps[i].product).split("")
      });
      rows.push({
        type: "line",
        startCol: result.steps[i].partialStartCol
      });

      if (i < result.steps.length - 1) {
        rows.push({
          type: "partial",
          startCol: result.steps[i + 1].partialStartCol,
          digits: String(result.steps[i + 1].partial).split("")
        });
      }
    }

    rows.push({
      type: "remainder",
      value: String(result.remainder),
      col: cols - 1
    });

    return {
      dividend: dividend,
      divisor: divisor,
      cols: cols,
      quotient: result.quotient,
      remainder: result.remainder,
      steps: result.steps,
      rows: rows,
      answerSlots: buildDivisionAnswerSlots(result.steps)
    };
  }

  function generateQuizProblem(opScreen, digits) {
    if (opScreen === "screen-subtract") {
      return generateSubtractionProblem(digits);
    }

    if (opScreen === "screen-multiply") {
      return generateMultiplicationProblem(digits);
    }

    if (opScreen === "screen-divide") {
      return generateDivisionProblem(digits);
    }

    return generateAdditionProblem(digits);
  }

  function getQuizAnswerFromProblem(opScreen, problem) {
    if (opScreen === "screen-subtract") {
      return problem.a - problem.b;
    }

    if (opScreen === "screen-multiply") {
      return problem.product;
    }

    if (opScreen === "screen-divide") {
      return problem.quotient;
    }

    return problem.sum;
  }

  function applyQuizTheme(opScreen) {
    var quizScreens = ["screen-quiz", "screen-quiz-wrong", "screen-quiz-correct"];
    var i;

    for (i = 0; i < quizScreens.length; i += 1) {
      var screen = document.getElementById(quizScreens[i]);
      if (!screen) {
        continue;
      }

      screen.classList.toggle("quiz-screen--subtract", opScreen === "screen-subtract");
      screen.classList.toggle("quiz-screen--add", opScreen === "screen-add");
      screen.classList.toggle("quiz-screen--multiply", opScreen === "screen-multiply");
      screen.classList.toggle("quiz-screen--divide", opScreen === "screen-divide");
    }
  }

  function applyQuizDigitClass(digits) {
    var quizScreens = ["screen-quiz", "screen-quiz-wrong", "screen-quiz-correct"];
    var digitClasses = ["quiz-digits-1", "quiz-digits-2", "quiz-digits-3", "quiz-digits-4"];
    var i;
    var j;
    var screen;

    for (i = 0; i < quizScreens.length; i += 1) {
      screen = document.getElementById(quizScreens[i]);
      if (!screen) {
        continue;
      }

      for (j = 0; j < digitClasses.length; j += 1) {
        screen.classList.remove(digitClasses[j]);
      }

      screen.classList.add("quiz-digits-" + digits);
    }
  }

  function isSlotQuiz() {
    return currentQuizState.answerSlots.length > 0;
  }

  function isMultiplyQuiz() {
    return currentQuizState.opScreen === "screen-multiply";
  }

  function isDivideQuiz() {
    return currentQuizState.opScreen === "screen-divide";
  }

  function buildMultiplyRows(a, b, cols) {
    var bStr = String(b);
    var rows = [];
    var i;
    var digit;
    var shift;
    var displayValue;
    var valueStr;

    if (bStr.length === 1) {
      return rows;
    }

    for (i = bStr.length - 1; i >= 0; i -= 1) {
      digit = parseInt(bStr[i], 10);
      shift = bStr.length - 1 - i;
      displayValue = a * digit;
      valueStr = String(displayValue);

      rows.push({
        shift: shift,
        digits: valueStr.split(""),
        startCol: cols - valueStr.length - shift
      });
    }

    return rows;
  }

  function buildMultiplyAnswerSlots(a, b, cols) {
    var rows = buildMultiplyRows(a, b, cols);
    var slots = [];
    var productDigits = padDigits(a * b, cols);
    var i;
    var j;

    for (i = 0; i < rows.length; i += 1) {
      for (j = 0; j < rows[i].digits.length; j += 1) {
        slots.push(rows[i].digits[j]);
      }
    }

    for (i = 0; i < productDigits.length; i += 1) {
      slots.push(productDigits[i]);
    }

    return slots;
  }

  function padDigits(num, cols) {
    var digits = String(num).split("");
    var padded = [];
    var padCount = cols - digits.length;
    var i;

    for (i = 0; i < padCount; i += 1) {
      padded.push("");
    }

    for (i = 0; i < digits.length; i += 1) {
      padded.push(digits[i]);
    }

    return padded;
  }

  function getAnswerBoxCount(opScreen, digits, answer) {
    if (opScreen === "screen-subtract") {
      return Math.max(1, String(Number(answer) || 0).length);
    }

    return digits;
  }

  function getAnswerDisplayDigits(opScreen, digits, answer) {
    if (opScreen === "screen-subtract") {
      return String(Number(answer) || 0).split("");
    }

    return padDigits(answer, digits);
  }

  function getEffectiveQuizAnswer() {
    if (currentQuizState.opScreen === "screen-subtract") {
      return currentQuizState.a - currentQuizState.b;
    }

    return currentQuizAnswer;
  }

  var CUSTOM_SELECT_FONT = '"양재백두체B", "Yj-BACDOO-Bold", sans-serif';
  var openCustomPicker = null;

  function applySelectFont(select) {
    var i;

    select.style.fontFamily = CUSTOM_SELECT_FONT;
    for (i = 0; i < select.options.length; i += 1) {
      select.options[i].style.fontFamily = CUSTOM_SELECT_FONT;
    }
  }

  function getCustomSelectPicker(select) {
    return select.closest(".custom-select-picker, .quiz-answer-picker");
  }

  function getCustomSelectList(picker) {
    var list = picker.querySelector(".custom-select-list, .quiz-answer-picker-list");
    if (!list && picker._portaledList) {
      return picker._portaledList;
    }
    return list;
  }

  function getCustomSelectTrigger(picker) {
    return picker.querySelector(".custom-select-trigger, .quiz-answer-picker-trigger");
  }

  function getCustomSelectItemClass(picker) {
    var list = getCustomSelectList(picker);
    return list ? list.dataset.itemClass : "custom-select-item";
  }

  function getOptionButtonLabel(option) {
    if (option.textContent) {
      return option.textContent;
    }
    if (option.value === "") {
      return "지우개";
    }
    return option.value;
  }

  function refreshCustomSelectList(select, list, itemClass) {
    var i;
    var option;
    var item;

    list.innerHTML = "";
    for (i = 0; i < select.options.length; i += 1) {
      option = select.options[i];
      item = document.createElement("button");
      item.type = "button";
      item.className = itemClass;
      if (option.value === "" && itemClass.indexOf("quiz-answer-picker-item") !== -1) {
        item.className += " quiz-answer-picker-item--clear";
      }
      item.dataset.value = option.value;
      item.textContent = getOptionButtonLabel(option);
      item.setAttribute("role", "option");
      item.style.fontFamily = CUSTOM_SELECT_FONT;
      list.appendChild(item);
    }
  }

  function syncCustomSelectTrigger(select, trigger, displayMode) {
    var option;

    if (displayMode === "value") {
      trigger.textContent = select.value;
      trigger.classList.remove("quiz-answer-box--correct", "quiz-answer-box--wrong");
      if (select.classList.contains("quiz-answer-box--correct")) {
        trigger.classList.add("quiz-answer-box--correct");
      } else if (select.classList.contains("quiz-answer-box--wrong")) {
        trigger.classList.add("quiz-answer-box--wrong");
      }
      return;
    }

    option = select.options[select.selectedIndex];
    trigger.textContent = option ? option.textContent : "";
  }

  function closeCustomPicker(picker) {
    var list;
    var trigger;

    if (!picker) {
      return;
    }

    list = getCustomSelectList(picker);
    trigger = getCustomSelectTrigger(picker);
    if (list) {
      list.hidden = true;
      resetQuizAnswerPickerList(list);
    }
    if (trigger) {
      trigger.classList.remove("quiz-answer-box--typing");
    }
    if (openCustomPicker === picker) {
      openCustomPicker = null;
    }
  }

  function closeAllCustomPickers() {
    document.querySelectorAll(".custom-select-picker, .quiz-answer-picker").forEach(function (picker) {
      closeCustomPicker(picker);
    });
  }

  function refreshCustomSelect(select) {
    var picker = getCustomSelectPicker(select);
    var list;
    var trigger;
    var displayMode;

    if (!picker) {
      return;
    }

    list = getCustomSelectList(picker);
    trigger = getCustomSelectTrigger(picker);
    displayMode = picker.dataset.displayMode || "text";
    refreshCustomSelectList(select, list, list.dataset.itemClass);
    syncCustomSelectTrigger(select, trigger, displayMode);
    applySelectFont(select);
  }

  function isQuizAnswerPicker(picker) {
    return picker.classList.contains("quiz-answer-picker");
  }

  function positionQuizAnswerPickerList(list, trigger) {
    var rect = trigger.getBoundingClientRect();
    var gap = 10;
    var listHeight;
    var listWidth;
    var left;
    var top;
    var spaceAbove;
    var spaceBelow;

    if (!list.dataset.portaled && list.parentNode !== document.body) {
      list._pickerParent = list.parentNode;
      list._pickerOwner = trigger.closest(".quiz-answer-picker");
      if (list._pickerOwner) {
        list._pickerOwner._portaledList = list;
      }
      document.body.appendChild(list);
      list.dataset.portaled = "true";
    }

    list.classList.remove("quiz-answer-picker-list--compact");
    if (trigger.offsetWidth <= 24) {
      list.classList.add("quiz-answer-picker-list--compact");
    }

    list.classList.add("quiz-answer-picker-list--floating");
    list.hidden = false;
    list.style.visibility = "hidden";
    listHeight = list.offsetHeight;
    listWidth = list.offsetWidth;
    left = Math.max(8, (window.innerWidth - listWidth) / 2);
    spaceAbove = rect.top;
    spaceBelow = window.innerHeight - rect.bottom;

    if (spaceAbove >= listHeight + gap) {
      top = rect.top - listHeight - gap;
    } else if (spaceBelow >= listHeight + gap) {
      top = rect.bottom + gap;
    } else if (spaceAbove >= spaceBelow) {
      top = Math.max(8, rect.top - listHeight - gap);
    } else {
      top = rect.bottom + gap;
    }

    if (top + listHeight > window.innerHeight - 8) {
      top = window.innerHeight - listHeight - 8;
    }
    if (top + listHeight + gap > rect.top && top < rect.bottom) {
      if (spaceBelow >= spaceAbove) {
        top = rect.bottom + gap;
      } else {
        top = Math.max(8, rect.top - listHeight - gap);
      }
    }

    list.style.left = left + "px";
    list.style.top = top + "px";
    list.style.visibility = "visible";
  }

  function resetQuizAnswerPickerList(list) {
    list.classList.remove("quiz-answer-picker-list--floating", "quiz-answer-picker-list--compact");
    list.style.left = "";
    list.style.top = "";
    list.style.visibility = "";
    if (list.dataset.portaled && list._pickerParent) {
      list._pickerParent.appendChild(list);
      delete list.dataset.portaled;
      delete list._pickerParent;
    }
    if (list._pickerOwner) {
      delete list._pickerOwner._portaledList;
      delete list._pickerOwner;
    }
  }

  function setAnswerBoxTyping(trigger, isTyping) {
    if (!trigger) {
      return;
    }
    trigger.classList.toggle("quiz-answer-box--typing", isTyping);
  }

  function openQuizAnswerPicker(picker, list, trigger) {
    positionQuizAnswerPickerList(list, trigger);
    setAnswerBoxTyping(trigger, true);
    openCustomPicker = picker;
  }

  function wrapSelectWithCustomPicker(select, config) {
    var picker = document.createElement("div");
    var trigger = document.createElement("button");
    var list = document.createElement("div");
    var itemClass = config.itemClass || "custom-select-item";
    var displayMode = config.displayMode || "text";

    picker.className = config.pickerClass || "custom-select-picker";
    picker.dataset.displayMode = displayMode;

    trigger.type = "button";
    trigger.className = config.triggerClass || "custom-select-trigger";
    trigger.style.fontFamily = CUSTOM_SELECT_FONT;
    if (select.getAttribute("aria-label")) {
      trigger.setAttribute("aria-label", select.getAttribute("aria-label"));
    }
    trigger.setAttribute("aria-haspopup", "listbox");

    list.className = config.listClass || "custom-select-list";
    list.hidden = true;
    list.dataset.itemClass = itemClass;
    list.setAttribute("role", "listbox");
    if (config.columns) {
      list.style.gridTemplateColumns = "repeat(" + config.columns + ", 1fr)";
    }

    select.classList.add("custom-select-native-hidden");
    if (config.nativeHiddenClass) {
      select.classList.add(config.nativeHiddenClass);
    }
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    select.dataset.customSelectEnhanced = "true";

    refreshCustomSelectList(select, list, itemClass);
    syncCustomSelectTrigger(select, trigger, displayMode);
    applySelectFont(select);

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      if (openCustomPicker && openCustomPicker !== picker) {
        closeCustomPicker(openCustomPicker);
      }
      refreshCustomSelectList(select, list, itemClass);
      syncCustomSelectTrigger(select, trigger, displayMode);

      if (list.hidden) {
        if (isQuizAnswerPicker(picker)) {
          openQuizAnswerPicker(picker, list, trigger);
        } else {
          list.hidden = false;
          openCustomPicker = picker;
        }
      } else {
        closeCustomPicker(picker);
      }
    });

    list.addEventListener("click", function (event) {
      var target = event.target.closest(".custom-select-item");
      if (!target) {
        return;
      }

      event.stopPropagation();
      select.value = target.dataset.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncCustomSelectTrigger(select, trigger, displayMode);
      closeCustomPicker(picker);
      trigger.focus();
    });

    if (select.parentNode) {
      select.parentNode.replaceChild(picker, select);
    }
    picker.appendChild(trigger);
    picker.appendChild(list);
    picker.appendChild(select);

    return picker;
  }

  function enhanceSelectInPlace(select, config) {
    if (!select) {
      return null;
    }

    if (select.dataset.customSelectEnhanced === "true") {
      refreshCustomSelect(select);
      return getCustomSelectPicker(select);
    }

    return wrapSelectWithCustomPicker(select, config);
  }

  function focusNextAnswerField(currentPicker) {
    var next = currentPicker.nextElementSibling;

    if (!next) {
      return;
    }

    if (next.classList.contains("quiz-answer-picker")) {
      getCustomSelectTrigger(next).focus();
      return;
    }

    if (next.classList.contains("quiz-answer-box") && next.focus) {
      next.focus();
    }
  }

  function handleAnswerSelectChange(select, picker) {
    var trigger = picker ? getCustomSelectTrigger(picker) : null;

    select.classList.remove("quiz-answer-box--correct", "quiz-answer-box--wrong");
    if (trigger) {
      syncCustomSelectTrigger(select, trigger, "value");
    }

    if (select.value && picker) {
      focusNextAnswerField(picker);
    }
  }

  function wrapAnswerSelectWithPicker(select) {
    var picker = wrapSelectWithCustomPicker(select, {
      pickerClass: "quiz-answer-picker custom-select-picker",
      triggerClass: "quiz-answer-box quiz-answer-picker-trigger custom-select-trigger",
      listClass: "quiz-answer-picker-list custom-select-list",
      itemClass: "quiz-answer-picker-item custom-select-item",
      nativeHiddenClass: "quiz-answer-box--native-hidden",
      columns: 5,
      displayMode: "value"
    });

    select.addEventListener("change", function () {
      handleAnswerSelectChange(select, picker);
    });

    return picker;
  }

  function enhanceStatsSelects() {
    enhanceSelectInPlace(document.getElementById("stats-year"), {
      pickerClass: "stats-select-picker custom-select-picker",
      triggerClass: "stats-select stats-select-trigger custom-select-trigger",
      listClass: "stats-select-list custom-select-list",
      itemClass: "stats-select-item custom-select-item",
      displayMode: "text"
    });
    enhanceSelectInPlace(document.getElementById("stats-month"), {
      pickerClass: "stats-select-picker custom-select-picker",
      triggerClass: "stats-select stats-select-trigger custom-select-trigger",
      listClass: "stats-select-list custom-select-list",
      itemClass: "stats-select-item custom-select-item",
      displayMode: "text"
    });
    enhanceSelectInPlace(document.getElementById("stats-op"), {
      pickerClass: "stats-select-picker custom-select-picker",
      triggerClass: "stats-select stats-select-trigger custom-select-trigger",
      listClass: "stats-select-list custom-select-list",
      itemClass: "stats-select-item custom-select-item",
      displayMode: "text"
    });
    enhanceSelectInPlace(document.getElementById("stats-digits"), {
      pickerClass: "stats-select-picker custom-select-picker",
      triggerClass: "stats-select stats-select-trigger custom-select-trigger",
      listClass: "stats-select-list custom-select-list",
      itemClass: "stats-select-item custom-select-item",
      displayMode: "text"
    });
  }

  if (!document.documentElement.dataset.customSelectBound) {
    document.documentElement.dataset.customSelectBound = "true";
    document.addEventListener("click", function () {
      closeAllCustomPickers();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeAllCustomPickers();
      }
    });
    window.addEventListener("resize", function () {
      if (!openCustomPicker || !isQuizAnswerPicker(openCustomPicker)) {
        return;
      }
      positionQuizAnswerPickerList(
        getCustomSelectList(openCustomPicker),
        getCustomSelectTrigger(openCustomPicker)
      );
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", function () {
        if (!openCustomPicker || !isQuizAnswerPicker(openCustomPicker)) {
          return;
        }
        positionQuizAnswerPickerList(
          getCustomSelectList(openCustomPicker),
          getCustomSelectTrigger(openCustomPicker)
        );
      });
    }
  }

  function createAnswerSelect(index, value, feedback) {
    var select = document.createElement("select");
    var digit;
    var option;
    var emptyOption;

    select.className = "quiz-answer-box";
    select.setAttribute("aria-label", (index + 1) + "번째 자리");

    emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "";
    select.appendChild(emptyOption);

    for (digit = 0; digit <= 9; digit += 1) {
      option = document.createElement("option");
      option.value = String(digit);
      option.textContent = String(digit);
      select.appendChild(option);
    }

    if (value !== undefined && value !== "") {
      select.value = String(value);
    }

    if (feedback === "correct") {
      select.classList.add("quiz-answer-box--correct");
    } else if (feedback === "wrong") {
      select.classList.add("quiz-answer-box--wrong");
    }

    applySelectFont(select);
    return wrapAnswerSelectWithPicker(select);
  }

  function createAnswerDisplay(digit) {
    var cell = document.createElement("span");
    cell.className = "quiz-answer-display quiz-answer-box--good";
    cell.textContent = digit;
    return cell;
  }

  function formatQuizNo(num) {
    return "NO." + String(num).padStart(2, "0");
  }

  function initQuizBadges() {
    var fightingBadge = document.querySelector(".quiz-badge-img--fighting");
    var retryBadge = document.querySelector(".quiz-badge-img--retry");
    var goodBadge = document.querySelector(".quiz-badge-img--good");

    if (fightingBadge) {
      fightingBadge.src = QUIZ_BADGE_IMAGES.fighting;
    }

    if (retryBadge) {
      retryBadge.src = QUIZ_BADGE_IMAGES.retry;
    }

    if (goodBadge) {
      goodBadge.src = QUIZ_BADGE_IMAGES.good;
    }
  }

  function initDiffDigitBoxes() {
    document
      .querySelectorAll(
        "[id^='screen-diff-'] .pick-item[data-diff-screen], #screen-difficulty .pick-item[data-difficulty]"
      )
      .forEach(function (btn) {
      if (btn.querySelector(".digit-boxes")) {
        return;
      }

      var digits = btn.hasAttribute("data-difficulty")
        ? parseInt(btn.getAttribute("data-difficulty"), 10)
        : parseInt(btn.getAttribute("data-diff-screen").replace("screen-diff-", ""), 10);
      var boxes = document.createElement("span");
      var i;

      boxes.className = "digit-boxes";
      boxes.setAttribute("aria-hidden", "true");

      for (i = 0; i < digits; i += 1) {
        var box = document.createElement("span");
        box.className = "digit-box";
        boxes.appendChild(box);
      }

      btn.appendChild(boxes);
    });
  }

  function updateQuizNumberDisplay() {
    var noText = formatQuizNo(quizProblemNumber);
    document.getElementById("quiz-no").textContent = noText;
    document.getElementById("quiz-wrong-no").textContent = noText;
    document.getElementById("quiz-correct-no").textContent = noText;
  }

  function appendMultiplyAnswerCell(grid, answerIndex, answers, feedback, readOnly) {
    var answerValue = answers ? answers[answerIndex] : "";
    var digitFeedback = feedback ? feedback[answerIndex] : null;

    if (readOnly) {
      grid.appendChild(createAnswerDisplay(answerValue));
    } else {
      grid.appendChild(createAnswerSelect(answerIndex, answerValue, digitFeedback));
    }

    return answerIndex + 1;
  }

  function appendMultiplySpacer(grid) {
    var spacer = document.createElement("span");
    spacer.className = "quiz-multiply-spacer";
    spacer.setAttribute("aria-hidden", "true");
    grid.appendChild(spacer);
  }

  function renderMultiplyLayout(gridId, a, b, cols, answers, feedback, options) {
    var grid = document.getElementById(gridId);
    var rows = buildMultiplyRows(a, b, cols);
    var simpleLayout = currentQuizState.digits === 1;
    var aDigits = padDigits(a, cols);
    var bDigits = padDigits(b, cols);
    var readOnly = options && options.readOnly;
    var answerIndex = 0;
    var line;
    var i;
    var j;
    var row;

    grid.innerHTML = "";
    grid.classList.remove("quiz-grid--divide");
    grid.classList.add("quiz-grid--multiply");
    grid.style.gridTemplateColumns = "28px repeat(" + cols + ", 34px)";

    var opEmptyTop = document.createElement("span");
    opEmptyTop.className = "quiz-op-cell";
    grid.appendChild(opEmptyTop);
    aDigits.forEach(function (digit) {
      var cell = document.createElement("span");
      cell.className = "quiz-digit";
      cell.textContent = digit;
      grid.appendChild(cell);
    });

    var opCell = document.createElement("span");
    opCell.className = "quiz-op-cell";
    opCell.textContent = "×";
    grid.appendChild(opCell);
    bDigits.forEach(function (digit) {
      var bottomCell = document.createElement("span");
      bottomCell.className = "quiz-digit";
      bottomCell.textContent = digit;
      grid.appendChild(bottomCell);
    });

    line = document.createElement("div");
    line.className = "quiz-line-full";
    line.setAttribute("aria-hidden", "true");
    grid.appendChild(line);

    if (!simpleLayout) {
      for (i = 0; i < rows.length; i += 1) {
        row = rows[i];
        var partialOp = document.createElement("span");
        partialOp.className = "quiz-op-cell";
        grid.appendChild(partialOp);

        for (j = 0; j < cols; j += 1) {
          var digitIndex = j - row.startCol;
          if (digitIndex >= 0 && digitIndex < row.digits.length) {
            answerIndex = appendMultiplyAnswerCell(grid, answerIndex, answers, feedback, readOnly);
          } else {
            appendMultiplySpacer(grid);
          }
        }
      }

      if (rows.length > 0) {
        line = document.createElement("div");
        line.className = "quiz-line-full";
        line.setAttribute("aria-hidden", "true");
        grid.appendChild(line);
      }
    }

    var finalOp = document.createElement("span");
    finalOp.className = "quiz-op-cell";
    grid.appendChild(finalOp);
    for (j = 0; j < cols; j += 1) {
      answerIndex = appendMultiplyAnswerCell(grid, answerIndex, answers, feedback, readOnly);
    }
    fitQuizProblemGrid(gridId);
  }

  function getDivideGridMetrics(cols, digitLevel) {
    var cell;
    var gap = 1;
    var side;
    var bracket;

    if (digitLevel === 4) {
      return {
        side: 20,
        bracket: 15,
        cell: 20,
        gap: 1
      };
    }

    if (digitLevel === 2) {
      return {
        side: 20,
        bracket: 20,
        cell: 26,
        gap: 3
      };
    }

    if (digitLevel === 1) {
      cell = 30;
    } else if (cols >= 4) {
      cell = 24;
    } else {
      cell = 26;
    }

    side = cell;
    bracket = Math.round(cell * 0.75);

    return {
      side: side,
      bracket: bracket,
      cell: cell,
      gap: gap
    };
  }

  function appendDivideSideCell(grid, text) {
    var cell = document.createElement("span");
    cell.className = text ? "quiz-digit quiz-divide-divisor" : "quiz-divide-side";
    cell.textContent = text || "";
    grid.appendChild(cell);
  }

  function appendDivideBracketCell(grid, showBracketMark) {
    var cell = document.createElement("span");

    cell.className = "quiz-divide-bracket";
    if (showBracketMark) {
      cell.classList.add("quiz-divide-bracket--mark");
    }

    grid.appendChild(cell);
  }

  function appendDivideLine(grid, startCol) {
    var line = document.createElement("div");
    line.className = "quiz-line-divide";
    line.style.gridColumn = 3 + (startCol || 0) + " / -1";
    line.setAttribute("aria-hidden", "true");
    grid.appendChild(line);
  }

  function appendDivideDigitCells(grid, cols, startCol, digits, answerIndex, answers, feedback, readOnly, useInput) {
    var j;
    var digitIndex;

    for (j = 0; j < cols; j += 1) {
      digitIndex = j - startCol;
      if (digitIndex >= 0 && digitIndex < digits.length) {
        if (useInput) {
          answerIndex = appendMultiplyAnswerCell(grid, answerIndex, answers, feedback, readOnly);
        } else {
          var cell = document.createElement("span");
          cell.className = "quiz-digit";
          cell.textContent = digits[digitIndex];
          grid.appendChild(cell);
        }
      } else {
        appendMultiplySpacer(grid);
      }
    }

    return answerIndex;
  }

  function renderDivisionLayout(gridId, layout, answers, feedback, options) {
    var grid = document.getElementById(gridId);
    var readOnly = options && options.readOnly;
    var answerIndex = 0;
    var metrics = getDivideGridMetrics(layout.cols, currentQuizState.digits);
    var i;
    var row;

    grid.innerHTML = "";
    grid.classList.remove("quiz-grid--multiply");
    grid.classList.add("quiz-grid--divide");
    grid.style.gridTemplateColumns =
      metrics.side + "px " + metrics.bracket + "px repeat(" + layout.cols + ", " + metrics.cell + "px)";
    grid.style.columnGap = metrics.gap + "px";
    grid.style.rowGap = currentQuizState.digits === 2 ? "2px" : "1px";
    grid.style.setProperty(
      "--divide-hline-width",
      metrics.bracket + layout.cols * metrics.cell + Math.max(0, layout.cols - 1) * metrics.gap + "px"
    );

    for (i = 0; i < layout.rows.length; i += 1) {
      row = layout.rows[i];

      if (row.type === "quotient") {
        appendDivideSideCell(grid, "");
        appendDivideBracketCell(grid, false);
        answerIndex = appendDivideDigitCells(
          grid,
          layout.cols,
          row.startCol,
          row.digits,
          answerIndex,
          answers,
          feedback,
          readOnly,
          true
        );
      } else if (row.type === "line") {
        appendDivideLine(grid, row.startCol);
      } else if (row.type === "dividend") {
        appendDivideSideCell(grid, row.divisor);
        appendDivideBracketCell(grid, true);
        appendDivideDigitCells(
          grid,
          layout.cols,
          0,
          row.digits,
          answerIndex,
          answers,
          feedback,
          readOnly,
          false
        );
      } else if (row.type === "product" || row.type === "partial") {
        appendDivideSideCell(grid, "");
        appendDivideBracketCell(grid, false);
        answerIndex = appendDivideDigitCells(
          grid,
          layout.cols,
          row.startCol,
          row.digits,
          answerIndex,
          answers,
          feedback,
          readOnly,
          true
        );
      } else if (row.type === "remainder") {
        appendDivideSideCell(grid, "");
        appendDivideBracketCell(grid, false);
        answerIndex = appendDivideDigitCells(
          grid,
          layout.cols,
          row.col,
          [row.value],
          answerIndex,
          answers,
          feedback,
          readOnly,
          false
        );
      }
    }
    fitQuizProblemGrid(gridId);
  }

  function fitQuizProblemGrid(gridId) {
    var grid = document.getElementById(gridId);
    var screen;
    var body;
    var problem;
    var submit;
    var available;
    var gridHeight;
    var scale;

    if (!grid) {
      return;
    }

    screen = grid.closest(".phone");
    if (!screen) {
      return;
    }

    body = screen.querySelector(".quiz-body");
    problem = screen.querySelector(".quiz-problem");
    if (!body || !problem) {
      return;
    }

    problem.style.transform = "";
    problem.style.marginBottom = "";

    submit = body.querySelector(".quiz-submit");
    available = body.clientHeight - (problem.offsetTop - body.offsetTop) - 4;
    if (submit) {
      available -= submit.offsetHeight + 6;
    }

    gridHeight = grid.offsetHeight;
    if (gridHeight > available && available > 40) {
      scale = Math.max(0.78, available / gridHeight);
      problem.style.transform = "scale(" + scale + ")";
      problem.style.transformOrigin = "top center";
      problem.style.marginBottom = gridHeight * scale - gridHeight + "px";
    }
  }

  function renderQuizLayout(gridId, a, b, digits, opSymbol, answers, feedback, options) {
    var grid = document.getElementById(gridId);
    var aDigits = padDigits(a, digits);
    var bDigits = padDigits(b, digits);
    var answerValueNum = currentQuizAnswer;
    var answerStartCol = 0;
    var answerBoxCount = digits;
    var line;
    var i;
    var j;
    var readOnly = options && options.readOnly;

    if (currentQuizState.opScreen === "screen-subtract" || opSymbol === "-") {
      answerValueNum = a - b;
      answerBoxCount = getAnswerBoxCount("screen-subtract", digits, answerValueNum);
      answerStartCol = digits - answerBoxCount;
    }

    grid.innerHTML = "";
    grid.classList.remove("quiz-grid--multiply", "quiz-grid--divide");
    grid.style.gridTemplateColumns = "28px repeat(" + digits + ", 34px)";

    var opEmpty = document.createElement("span");
    opEmpty.className = "quiz-op-cell";
    grid.appendChild(opEmpty);
    aDigits.forEach(function (digit) {
      var cell = document.createElement("span");
      cell.className = "quiz-digit";
      cell.textContent = digit;
      grid.appendChild(cell);
    });

    var opCell = document.createElement("span");
    opCell.className = "quiz-op-cell";
    opCell.textContent = opSymbol;
    grid.appendChild(opCell);
    bDigits.forEach(function (digit) {
      var bottomCell = document.createElement("span");
      bottomCell.className = "quiz-digit";
      bottomCell.textContent = digit;
      grid.appendChild(bottomCell);
    });

    line = document.createElement("div");
    line.className = "quiz-line-full";
    line.setAttribute("aria-hidden", "true");
    grid.appendChild(line);

    var answerOp = document.createElement("span");
    answerOp.className = "quiz-op-cell";
    grid.appendChild(answerOp);
    for (i = 0; i < digits; i += 1) {
      if (i < answerStartCol) {
        var answerSpacer = document.createElement("span");
        answerSpacer.className = "quiz-answer-spacer";
        answerSpacer.setAttribute("aria-hidden", "true");
        grid.appendChild(answerSpacer);
        continue;
      }

      j = i - answerStartCol;
      var answerValue = answers ? answers[j] : "";
      var digitFeedback = feedback ? feedback[j] : null;

      if (readOnly) {
        grid.appendChild(createAnswerDisplay(answerValue));
      } else {
        grid.appendChild(createAnswerSelect(j, answerValue, digitFeedback));
      }
    }
    fitQuizProblemGrid(gridId);
  }

  function getQuizAnswers(gridId) {
    var selects = document.querySelectorAll("#" + gridId + " select.quiz-answer-box");
    var values = [];
    var answerText = "";
    var i;

    for (i = 0; i < selects.length; i += 1) {
      values.push(selects[i].value);
      answerText += selects[i].value;
    }

    return {
      selects: selects,
      values: values,
      answerText: answerText
    };
  }

  function renderQuizGrid(gridId, answers, feedback, options) {
    if (isDivideQuiz()) {
      renderDivisionLayout(gridId, currentQuizState.divisionLayout, answers, feedback, options);
      return;
    }

    if (isMultiplyQuiz()) {
      renderMultiplyLayout(
        gridId,
        currentQuizState.a,
        currentQuizState.b,
        currentQuizState.cols,
        answers,
        feedback,
        options
      );
      return;
    }

    renderQuizLayout(
      gridId,
      currentQuizState.a,
      currentQuizState.b,
      currentQuizState.digits,
      currentQuizState.opSymbol,
      answers,
      feedback,
      options
    );
  }

  function getDigitFeedback(userValues) {
    var feedback = [];
    var correctDigits;
    var i;

    if (isSlotQuiz()) {
      for (i = 0; i < currentQuizState.answerSlots.length; i += 1) {
        feedback.push(userValues[i] === currentQuizState.answerSlots[i] ? "correct" : "wrong");
      }
      return feedback;
    }

    correctDigits = getAnswerDisplayDigits(
      currentQuizState.opScreen,
      currentQuizState.digits,
      getEffectiveQuizAnswer()
    );
    for (i = 0; i < correctDigits.length; i += 1) {
      feedback.push(userValues[i] === correctDigits[i] ? "correct" : "wrong");
    }

    return feedback;
  }

  function isQuizAnswerCorrect(userValues) {
    var i;

    if (isSlotQuiz()) {
      for (i = 0; i < currentQuizState.answerSlots.length; i += 1) {
        if (userValues[i] !== currentQuizState.answerSlots[i]) {
          return false;
        }
      }
      return true;
    }

    return parseInt(userValues.join(""), 10) === getEffectiveQuizAnswer();
  }

  function showQuizWrongScreen(userValues) {
    var feedback = getDigitFeedback(userValues);

    if (currentQuizState.problem) {
      addWrongProblem(currentQuizState.opScreen, currentQuizState.digits, currentQuizState.problem);
    }

    document.getElementById("quiz-wrong-char").src = currentQuizState.charSrc;
    document.getElementById("quiz-wrong-title").textContent = currentQuizState.title;
    updateQuizNumberDisplay();
    renderQuizGrid("quiz-wrong-grid", userValues, feedback);
    showScreen("screen-quiz-wrong");
  }

  function showQuizCorrectScreen(userValues) {
    if (quizMode === "wrong" && currentQuizState.problem) {
      removeWrongProblem(currentQuizState.opScreen, currentQuizState.digits, currentQuizState.problem);
    }

    document.getElementById("quiz-correct-char").src = currentQuizState.charSrc;
    document.getElementById("quiz-correct-title").textContent = currentQuizState.title;
    updateQuizNumberDisplay();
    renderQuizGrid("quiz-correct-grid", userValues, null, { readOnly: true });
    showScreen("screen-quiz-correct");
    requestAnimationFrame(function () {
      playQuizFireworks();
    });
  }

  var quizFireworksFrame = null;

  function stopQuizFireworks() {
    if (quizFireworksFrame) {
      cancelAnimationFrame(quizFireworksFrame);
      quizFireworksFrame = null;
    }

    var canvas = document.getElementById("quiz-fireworks");
    if (!canvas) {
      return;
    }

    var ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function playQuizFireworks() {
    var canvas = document.getElementById("quiz-fireworks");
    var screen = document.getElementById("screen-quiz-correct");
    var rect;
    var dpr;
    var ctx;
    var particles = [];
    var colors = ["#e63b3b", "#ff8a6a", "#ffd166", "#4ecdc4", "#ff6b9d", "#ffe66d", "#ffffff"];
    var startTime = performance.now();
    var duration = 2400;
    var burstCount = 0;
    var maxBursts = 6;
    var width;
    var height;

    if (!canvas || !screen) {
      return;
    }

    stopQuizFireworks();

    rect = screen.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    function addBurst() {
      var x = width * (0.2 + Math.random() * 0.6);
      var y = height * (0.18 + Math.random() * 0.38);
      var color = colors[Math.floor(Math.random() * colors.length)];
      var i;
      var angle;
      var speed;

      for (i = 0; i < 30; i += 1) {
        angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.4;
        speed = 1.8 + Math.random() * 3.2;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.016 + Math.random() * 0.014,
          color: color,
          size: 1.5 + Math.random() * 2.5
        });
      }
    }

    function frame(now) {
      var elapsed = now - startTime;
      var i;
      var particle;

      ctx.clearRect(0, 0, width, height);

      if (burstCount < maxBursts && elapsed > burstCount * 320) {
        addBurst();
        burstCount += 1;
      }

      for (i = particles.length - 1; i >= 0; i -= 1) {
        particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.055;
        particle.vx *= 0.985;
        particle.life -= particle.decay;

        if (particle.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, particle.life);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      if (elapsed < duration || particles.length > 0) {
        quizFireworksFrame = requestAnimationFrame(frame);
      } else {
        stopQuizFireworks();
      }
    }

    addBurst();
    burstCount = 1;
    quizFireworksFrame = requestAnimationFrame(frame);
  }

  function loadQuizProblem(opScreen, digits, problemOverride) {
    var problem = problemOverride || generateQuizProblem(opScreen, digits);
    var opSymbol = OP_SYMBOLS[opScreen] || "+";
    var opLabel = OP_LABELS[opScreen] || "덧셈";
    var divisionLayout = null;
    var answerSlots = [];
    var problemSnapshot = captureProblemSnapshot(opScreen, problem);

    if (opScreen === "screen-multiply") {
      answerSlots = buildMultiplyAnswerSlots(problem.a, problem.b, problem.cols);
    } else if (opScreen === "screen-divide") {
      divisionLayout = buildDivisionLayout(problem.dividend, problem.divisor);
      answerSlots = divisionLayout.answerSlots;
    }

    currentQuizAnswer = getQuizAnswerFromProblem(opScreen, problem);
    if (opScreen === "screen-subtract") {
      currentQuizAnswer = problem.a - problem.b;
    }
    currentQuizState = {
      a: problem.a || problem.dividend,
      b: problem.b || problem.divisor,
      digits: digits,
      cols: problem.cols || digits,
      opScreen: opScreen,
      opSymbol: opSymbol,
      title: opLabel + " " + digits + "자리",
      charSrc: OP_CHARACTERS[opScreen] || OP_CHARACTERS["screen-add"],
      answerSlots: answerSlots,
      divisionLayout: divisionLayout,
      problem: problemSnapshot
    };

    applyQuizTheme(opScreen);
    applyQuizDigitClass(digits);
    document.getElementById("quiz-char").src = currentQuizState.charSrc;
    document.getElementById("quiz-title").textContent = currentQuizState.title;
    updateQuizNumberDisplay();
    renderQuizGrid("quiz-problem-grid");
  }

  function startQuiz(opScreen, digits) {
    if (quizMode === "wrong") {
      var wrongProblems = getWrongProblemsForQuiz(opScreen, digits);

      if (wrongProblems.length === 0) {
        alert("선택한 항목의 틀렸던 문제가 없습니다.");
        return;
      }

      quizProblemNumber = 1;
      loadQuizProblem(opScreen, digits, wrongProblems[0].problem);
      showScreen("screen-quiz");
      return;
    }

    quizProblemNumber = 1;
    loadQuizProblem(opScreen, digits);
    showScreen("screen-quiz");
  }

  function nextQuizProblem() {
    stopQuizFireworks();
    if (quizMode === "wrong") {
      var remaining = getWrongProblemsForQuiz(currentQuizState.opScreen, currentQuizState.digits);

      if (remaining.length === 0) {
        alert("틀렸던 문제를 모두 맞혔습니다!");
        goToHomeScreen();
        return;
      }

      quizProblemNumber += 1;
      loadQuizProblem(currentQuizState.opScreen, currentQuizState.digits, remaining[0].problem);
      showScreen("screen-quiz");
      return;
    }

    quizProblemNumber += 1;
    loadQuizProblem(currentQuizState.opScreen, currentQuizState.digits);
    showScreen("screen-quiz");
  }

  function checkQuizAnswer(gridId) {
    var result = getQuizAnswers(gridId);
    var i;

    for (i = 0; i < result.values.length; i += 1) {
      if (!result.values[i]) {
        if (isSlotQuiz() && !currentQuizState.answerSlots[i]) {
          continue;
        }
        alert("모든 답박스에 숫자를 넣으세요");
        return;
      }
    }

    if (isQuizAnswerCorrect(result.values)) {
      recordQuizAttempt(currentQuizState.opScreen, currentQuizState.digits, true);
      showQuizCorrectScreen(result.values);
      return;
    }

    recordQuizAttempt(currentQuizState.opScreen, currentQuizState.digits, false);
    showQuizWrongScreen(result.values);
  }

  function handleLogin() {
    var name = loginForm.name.value.trim();
    var password = loginForm.password.value.trim();

    if (!name || !password) {
      alert("이름과 비밀번호를 입력해 주세요.");
      return;
    }

    if (isMasterLogin(name, password)) {
      currentUserName = name;
      isCurrentUserMaster = true;
      updateScreen2Exit();
      showScreen("screen-2");
      return;
    }

    var users = getUsers();
    var user = users.find(function (item) {
      return item.name === name;
    });

    if (!user) {
      alert("가입되지 않은 이름입니다.\n'새로 가입'으로 먼저 등록해 주세요.");
      return;
    }

    if (user.password !== password) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    currentUserName = name;
    isCurrentUserMaster = false;
    updateScreen2Exit();
    showScreen("screen-2");
  }

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    handleLogin();
  });

  loginLink.addEventListener("click", function (event) {
    event.preventDefault();
    handleLogin();
  });

  signupLink.addEventListener("click", function (event) {
    event.preventDefault();
    resetSignupForm();
    showScreen("screen-signup");
  });

  signupForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = signupForm.name.value.trim();
    var password = signupForm.password.value.trim();
    var motto = signupForm.motto.value.trim();

    if (!name || !password) {
      alert("이름과 비밀번호를 입력해 주세요.");
      return;
    }

    if (name === MASTER_ACCOUNT.name) {
      alert("이미 사용 중인 이름입니다.");
      return;
    }

    var users = getUsers();

    if (users.some(function (item) {
      return item.name === name;
    })) {
      alert("이미 가입된 이름입니다.");
      return;
    }

    users.push({
      name: name,
      password: password,
      age: ageValue,
      motto: motto
    });
    saveUsers(users);
    alert("가입이 완료되었습니다.\n로그인해 주세요.");
    resetSignupForm();
    showScreen("screen-1");
  });

  signupExitBtn.addEventListener("click", function () {
    resetSignupForm();
    showScreen("screen-1");
  });

  ageUpBtn.addEventListener("click", function () {
    if (ageValue < 99) {
      ageValue += 1;
      updateAgeDisplay();
    }
  });

  ageDownBtn.addEventListener("click", function () {
    if (ageValue > 1) {
      ageValue -= 1;
      updateAgeDisplay();
    }
  });

  exitBtn.addEventListener("click", goToLoginScreen);

  adminBtn.addEventListener("click", openAdminScreen);
  adminExitBtn.addEventListener("click", function () {
    showScreen("screen-2");
  });
  adminSaveBtn.addEventListener("click", saveAdminUsers);

  menuNewBtn.addEventListener("click", function () {
    quizMode = "new";
    resetDifficultyPickVisibility();
    playMenuTransition(menuNewBtn, function () {
      showScreen("screen-pick");
    });
  });

  menuWrongBtn.addEventListener("click", function () {
    quizMode = "wrong";
    playMenuTransition(menuWrongBtn, function () {
      showScreen("screen-pick");
    });
  });

  menuStatsBtn.addEventListener("click", function () {
    if (!currentUserName) {
      alert("로그인 후 이용해 주세요.");
      return;
    }

    playMenuTransition(menuStatsBtn, openStatsScreen);
  });

  pickPlusBtn.addEventListener("click", function () {
    showScreen("screen-add");
  });

  pickMinusBtn.addEventListener("click", function () {
    showScreen("screen-subtract");
  });

  pickMultiplyBtn.addEventListener("click", function () {
    showScreen("screen-multiply");
  });

  pickDivideBtn.addEventListener("click", function () {
    showScreen("screen-divide");
  });

  document.querySelectorAll(".exit-to-login-btn").forEach(function (btn) {
    btn.addEventListener("click", goToLoginScreen);
  });

  document.querySelectorAll(".exit-to-home-btn").forEach(function (btn) {
    btn.addEventListener("click", goToHomeScreen);
  });

  document.querySelectorAll("[data-op-screen]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showScreen(btn.getAttribute("data-op-screen"));
    });
  });

  document.querySelectorAll("#screen-add .go-btn, #screen-subtract .go-btn, #screen-multiply .go-btn, #screen-divide .go-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var screen = btn.closest(".phone");
      var availableDigits;

      if (screen) {
        lastOpScreen = screen.id;
      }

      if (quizMode === "wrong") {
        availableDigits = updateWrongDifficultyVisibility(lastOpScreen);

        if (availableDigits.length === 0) {
          alert("선택한 항목의 틀렸던 문제가 없습니다.");
          return;
        }

        showScreen("screen-difficulty");
        return;
      }

      resetDifficultyPickVisibility();
      showScreen("screen-difficulty");
    });
  });

  document.querySelectorAll("#screen-difficulty [data-difficulty]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var level = parseInt(btn.getAttribute("data-difficulty"), 10);

      if (quizMode === "wrong" && !hasWrongProblemsForDigits(lastOpScreen, level)) {
        return;
      }

      if (quizMode === "wrong") {
        updateWrongDifficultyVisibility(lastOpScreen);
      }

      showScreen(DIFFICULTY_SCREENS[level - 1]);
    });
  });

  document.querySelectorAll("[data-diff-screen]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var targetScreen = btn.getAttribute("data-diff-screen");
      var digits = parseInt(targetScreen.replace("screen-diff-", ""), 10);

      if (quizMode === "wrong" && !hasWrongProblemsForDigits(lastOpScreen, digits)) {
        return;
      }

      if (quizMode === "wrong") {
        updateWrongDifficultyVisibility(lastOpScreen);
      }

      showScreen(targetScreen);
    });
  });

  document.querySelectorAll("#screen-diff-1 .go-btn, #screen-diff-2 .go-btn, #screen-diff-3 .go-btn, #screen-diff-4 .go-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var screen = btn.closest(".phone");
      if (!screen) {
        return;
      }

      lastDiffScreen = screen.id;
      var digits = parseInt(screen.id.replace("screen-diff-", ""), 10);

      if (
        lastOpScreen === "screen-add" ||
        lastOpScreen === "screen-subtract" ||
        lastOpScreen === "screen-multiply" ||
        lastOpScreen === "screen-divide"
      ) {
        startQuiz(lastOpScreen, digits);
      }
    });
  });

  document.getElementById("quiz-submit-btn").addEventListener("click", function () {
    checkQuizAnswer("quiz-problem-grid");
  });

  document.getElementById("quiz-retry-submit-btn").addEventListener("click", function () {
    checkQuizAnswer("quiz-wrong-grid");
  });

  document.getElementById("quiz-next-btn").addEventListener("click", nextQuizProblem);

  initQuizBadges();
  initDiffDigitBoxes();
  initStatsScreen();
  updateScreen2Exit();
})();
