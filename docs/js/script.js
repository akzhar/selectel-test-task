'use strict';

(function () {
  var DEBOUNCE_INTERVAL = 500;
  var lastTimeout;

  function debounce(cb) {
    return function () {
      var parameters = arguments;

      if (lastTimeout) {
        window.clearTimeout(lastTimeout);
      }

      lastTimeout = window.setTimeout(function () {
        cb.apply(null, parameters);
      }, DEBOUNCE_INTERVAL);
    };
  }

  window.utils = {
    debounce: debounce
  };
})();
'use strict';

(function () {
  window.data = {
    SERVER_DATA: [],
    START_VCPU_COUNT: 6,
    FILTER_ANY_VALUE: 'any',
    CATALOG_CLASS: 'catalog__content',
    FILTERS_CLASS: 'filters',
    LOADER_ID: 'loader',
    PRICE_UNIT: '₽/месяц',
    SELECTEL_URL: 'https://selectel.ru/',
    OUTPUT_CLASS: 'filters',
    RANGE_BAR_ID: 'bar-js',
    RANGE_TOGGLE_ID: 'toggle-js',
    RANGE_OUTPUT_ID: 'cpu-js',
    MSG_CLASS: 'catalog__message',
    MSG_SHOW_CLASS: 'catalog__message--show'
  };
})();
'use strict';

(function () {
  var dependencies = {
    data: window.data
  };
  var STEP = 2; // must be >= 1

  var MIN = 2;
  var MAX = 12;
  var EXCEPTIONS = [10];
  var UNIT = 'ядер';
  var RANGE_BAR = document.querySelector("#".concat(dependencies.data.RANGE_BAR_ID));
  var RANGE_TOGGLE = RANGE_BAR.querySelector("#".concat(dependencies.data.RANGE_TOGGLE_ID));
  var RANGE_OUTPUT = document.querySelector("#".concat(dependencies.data.RANGE_OUTPUT_ID));
  var SCALE_COLOR = '#E5E5E5';
  var SCALE_COLOR_FILL = '#2F93FE';
  var toggleShift = 0;
  var barWidth = 0;
  var stepWidth = 0;
  var availableValues = [];
  defineAvailableValues();
  updateVariables();
  RANGE_TOGGLE.addEventListener('mousedown', onToggleMouseDown);
  RANGE_BAR.addEventListener('click', onBarClick);
  window.addEventListener('resize', onWindowResize);
  forceMoveToggleToValue(dependencies.data.START_VCPU_COUNT);

  function defineAvailableValues() {
    var varCount = Math.ceil((MAX - MIN) / STEP + EXCEPTIONS.length);

    for (var i = 1; i <= varCount; i++) {
      var val = i * STEP;

      if (val < MIN) {
        varCount++;
        continue;
      }

      if (!(EXCEPTIONS.indexOf(val) !== -1)) availableValues.push(val);
    }
  }

  function updateVariables() {
    barWidth = RANGE_BAR.offsetWidth;
    stepWidth = barWidth / (STEP * (availableValues.length - 1));
  }

  function getTogglePosFromCursorPos(cursorPosition) {
    var barClientCoords = RANGE_BAR.getBoundingClientRect();
    var togglePositionOnBar = cursorPosition - barClientCoords.left + pageXOffset - toggleShift;
    return togglePositionOnBar;
  }

  function checkBarLimits(togglePositionOnBar) {
    if (togglePositionOnBar < 0) return 0;
    if (togglePositionOnBar > barWidth) return barWidth;
    return togglePositionOnBar;
  }

  function moveToggle(position) {
    RANGE_TOGGLE.style.left = "".concat(position, "px");
  }

  function writeValue(result) {
    RANGE_OUTPUT.value = "".concat(result, " ").concat(UNIT);
  }

  function getValue() {
    var spacePos = RANGE_OUTPUT.value.indexOf(' ');
    return +RANGE_OUTPUT.value.slice(0, spacePos);
  }

  function fillBar(persents) {
    RANGE_BAR.style.background = "linear-gradient(to right ,".concat(SCALE_COLOR_FILL, " 0%, ").concat(SCALE_COLOR_FILL, " ").concat(persents, "%, ").concat(SCALE_COLOR, " ").concat(persents, "%, ").concat(SCALE_COLOR, " 100%)");
  }

  function defineToggleShift(startPosition) {
    var toggleClientCoords = RANGE_TOGGLE.getBoundingClientRect();
    toggleShift = startPosition - toggleClientCoords.left + pageXOffset;
  }

  function onDocumentMouseUp() {
    document.removeEventListener('mousemove', onDocumentMouseMove);
    document.removeEventListener('mouseup', onDocumentMouseUp);
  }

  function calcToggleMove(evt) {
    var cursorPosition = evt.clientX;
    var newTogglePositionOnBar = getTogglePosFromCursorPos(cursorPosition);
    newTogglePositionOnBar = checkBarLimits(newTogglePositionOnBar);
    var result = newTogglePositionOnBar / stepWidth + MIN;
    EXCEPTIONS.forEach(function (x) {
      if (result + STEP > x) result += STEP;
    });

    for (var i = 0; i < availableValues.length; i++) {
      if (availableValues[i] - result >= 0 && availableValues[i] - result <= STEP / 2) result = availableValues[i];
      if (result - availableValues[i] >= 0 && result - availableValues[i] <= STEP / 2) result = availableValues[i];
    }

    newTogglePositionOnBar = (result - MIN) * stepWidth;
    newTogglePositionOnBar = checkBarLimits(newTogglePositionOnBar);
    var persents = Math.round(newTogglePositionOnBar / barWidth * 100);

    if (availableValues.indexOf(result) !== -1) {
      moveToggle(newTogglePositionOnBar);
      writeValue(result);
      fillBar(persents);
    }
  }

  function forceMoveToggleToValue(value) {
    var togglePositionOnBar = (value - MIN) * stepWidth;
    var persents = Math.round(togglePositionOnBar / barWidth * 100);
    moveToggle(togglePositionOnBar);
    writeValue(value);
    fillBar(persents);
  }

  function onToggleMouseDown(evt) {
    var startPosition = evt.pageX;
    defineToggleShift(startPosition);
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('mouseup', onDocumentMouseUp);
  }

  function onWindowResize() {
    updateVariables();
    var currentValue = getValue();
    forceMoveToggleToValue(currentValue);
  }

  function onDocumentMouseMove(evt) {
    calcToggleMove(evt);
  }

  function onBarClick(evt) {
    calcToggleMove(evt);
  }

  window.rangeControl = {
    getValue: getValue
  };
})();
'use strict';

(function () {
  var MAX_RESPONSE_TIME = 5000;
  var MS_PER_SECOND = 1000;
  var TIME_UNIT = 'cек';
  var OK_STATUS = 200;
  var Url = {
    // GET: 'https://api.jsonbin.io/b/5df3c10a2c714135cda0bf0f/1'
    GET: 'https://api.jsonbin.io/b/5e08fa8df9369177b27484fa'
  };

  function load(onLoad, onError, method, data) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
      if (xhr.status === OK_STATUS) {
        onLoad(xhr.response);
      } else {
        onError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F, \u0441\u0442\u0430\u0442\u0443\u0441 \u043E\u0442\u0432\u0435\u0442\u0430: ".concat(xhr.status, " ").concat(xhr.statusText));
      }
    });
    xhr.addEventListener('error', function () {
      onError('Ошибка соединения');
    });
    xhr.addEventListener('timeout', function () {
      onError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F, \u0437\u0430\u043F\u0440\u043E\u0441 \u043D\u0435 \u0443\u0441\u043F\u0435\u043B \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C\u0441\u044F \u0437\u0430 ".concat(xhr.timeout / MS_PER_SECOND, " ").concat(TIME_UNIT));
    });
    xhr.open(method, Url[method], true);
    xhr.setRequestHeader('secret-key', '$2b$10$PJB9U7iJ7ytHYcfpTTNvJ./lH8zQor1GKkTgNRwy51cTnZi8lBZVS');
    xhr.timeout = MAX_RESPONSE_TIME;
    xhr.send(data);
  }

  window.backend = {
    load: load
  };
})();
'use strict';

(function () {
  var dependencies = {
    data: window.data
  };
  var MSG = document.querySelector(".".concat(dependencies.data.MSG_CLASS));

  function showErrorMessage(error) {
    MSG.textContent = error;
    MSG.classList.add("".concat(dependencies.data.MSG_SHOW_CLASS));
  }

  function showEmptyMessage() {
    MSG.textContent = 'Нет результатов';
    MSG.classList.add("".concat(dependencies.data.MSG_SHOW_CLASS));
  }

  function removeEmptyMessage() {
    MSG.classList.remove("".concat(dependencies.data.MSG_SHOW_CLASS));
  }

  window.message = {
    showErrorMessage: showErrorMessage,
    showEmptyMessage: showEmptyMessage,
    removeEmptyMessage: removeEmptyMessage
  };
})();
'use strict';

(function () {
  var dependencies = {
    data: window.data
  };
  var CATALOG = document.querySelector(".".concat(dependencies.data.CATALOG_CLASS));

  function render(data) {
    var fragment = document.createDocumentFragment();
    data.forEach(function (cardData) {
      var card = create(cardData);
      fragment.appendChild(card);
    });
    CATALOG.appendChild(fragment);
  }

  function create(cardData) {
    var card = document.createElement('div');
    card.classList.add('product');
    var head = document.createElement('h3');
    head.classList.add('product__head');
    var container = document.createElement('div');
    container.classList.add('product__attributes');
    var attrCpu = document.createElement('div');
    attrCpu.classList.add('product__attr');
    attrCpu.classList.add('product__attr--cpu');
    var attrRam = document.createElement('div');
    attrRam.classList.add('product__attr');
    attrRam.classList.add('product__attr--ram');
    var attrMemory = document.createElement('div');
    attrMemory.classList.add('product__attr');
    attrMemory.classList.add('product__attr--memory');
    var wrapper = document.createElement('div');
    wrapper.classList.add('product__wrapper');
    var price = document.createElement('p');
    price.classList.add('product__price');
    var priceValue = document.createElement('b');
    priceValue.classList.add('product__price-value');
    var priceUnit = document.createElement('b');
    priceUnit.classList.add('product__price-unit');
    priceUnit.textContent = dependencies.data.PRICE_UNIT;
    var orderBtn = document.createElement('a');
    orderBtn.classList.add('product__orderbtn');
    orderBtn.classList.add('btn');
    orderBtn.href = dependencies.data.SELECTEL_URL;
    orderBtn.target = 'blank';
    orderBtn.textContent = 'Заказать'; // данные

    head.textContent = cardData.name;
    var coresCount = '';
    if (cardData.cpu.cores >= 2) coresCount = "".concat(cardData.cpu.count, " x ");
    var cpuName = cardData.cpu.name;
    var lastSpacePos = cpuName.lastIndexOf(' ');
    var temp = cpuName.split('');
    temp.splice(lastSpacePos, 1, '<br>');
    cpuName = temp.join('');
    attrCpu.innerHTML = "".concat(coresCount).concat(cpuName, ", ").concat(cardData.cpu.cores, " \u044F\u0434\u0435\u0440");
    attrRam.textContent = cardData.ram;
    var disksCount = '';
    if (cardData.disk.count >= 2) disksCount = "".concat(cardData.disk.count, " x ");
    attrMemory.textContent = "".concat(disksCount).concat(cardData.disk.value, " \u0413\u0411 ").concat(cardData.disk.type);
    var priceStr = "".concat(cardData.price / 100);

    if (priceStr.length > 3) {
      temp = priceStr.split('');
      temp.splice(priceStr.length - 3, 0, ' ');
      priceStr = temp.join('');
    }

    priceValue.textContent = priceStr; //

    container.appendChild(attrCpu);
    container.appendChild(attrRam);
    container.appendChild(attrMemory);
    price.appendChild(priceValue);
    price.appendChild(priceUnit);
    wrapper.appendChild(price);
    wrapper.appendChild(orderBtn);
    container.appendChild(wrapper);
    card.appendChild(head);
    card.appendChild(container);
    return card;
  }

  function removeAll() {
    var cards = CATALOG.querySelectorAll('.product');
    Array.prototype.forEach.call(cards, function (card) {
      CATALOG.removeChild(card);
    });
  }

  window.cards = {
    render: render,
    removeAll: removeAll
  };
})();
'use strict';

(function () {
  var dependencies = {
    data: window.data,
    utils: window.utils,
    cards: window.cards,
    message: window.message,
    rangeControl: window.rangeControl
  };
  var FILTERS_CONTAINER = document.querySelector(".".concat(dependencies.data.FILTERS_CLASS));
  var RANGE_BAR = document.querySelector("#".concat(dependencies.data.RANGE_BAR_ID));
  var RANGE_TOGGLE = RANGE_BAR.querySelector("#".concat(dependencies.data.RANGE_TOGGLE_ID));
  var FilterFunction = {
    'bar-js': checkCoresCount,
    'toggle-js': checkCoresCount,
    'gpu-js': checkGPU,
    'raid-js': checkRAID,
    'ssd-js': checkSSD
  };
  var FiltersState = {};
  var dataToBeFiltered = [];
  FILTERS_CONTAINER.addEventListener('change', onFiltersChange);
  RANGE_TOGGLE.addEventListener('mousedown', onFiltersChange);
  RANGE_BAR.addEventListener('click', onFiltersChange);

  function filterData(callback, filterValue) {
    var filteredData = dataToBeFiltered;

    if (filterValue !== dependencies.data.FILTER_ANY_VALUE) {
      filteredData = dataToBeFiltered.filter(function (it) {
        return callback(it, filterValue);
      });
    }

    dataToBeFiltered = filteredData;
  }

  function checkCoresCount(it, value) {
    var condition = it.cpu.cores * it.cpu.count === value;
    return condition ? it : null;
  }

  function checkGPU(it) {
    var condition = Object.prototype.hasOwnProperty.call(it, 'gpu');
    return condition ? it : null;
  }

  function checkRAID(it) {
    var condition = it.disk.count >= 2;
    return condition ? it : null;
  }

  function checkSSD(it) {
    var condition = it.disk.type === 'SSD';
    return condition ? it : null;
  }

  function renderFilteredCards() {
    dependencies.cards.removeAll();

    if (dataToBeFiltered.length === 0) {
      dependencies.message.showEmptyMessage();
    } else {
      dependencies.message.removeEmptyMessage();
      dependencies.cards.render(dataToBeFiltered);
    }
  }

  function onFiltersChange(evt) {
    dataToBeFiltered = dependencies.data.SERVER_DATA;
    var filter = evt.target;
    var key = filter.id;

    if (key === 'bar-js' || key === 'toggle-js') {
      FiltersState[key] = dependencies.rangeControl.getValue();
    } else {
      FiltersState[key] = filter.value;
    }

    if (filter.checked === false) FiltersState[key] = dependencies.data.FILTER_ANY_VALUE;

    for (var filterKey in FiltersState) {
      if (Object.prototype.hasOwnProperty.call(FiltersState, filterKey)) {
        var callback = FilterFunction[filterKey];
        var filterValue = FiltersState[filterKey];
        filterData(callback, filterValue);
      }
    }

    dependencies.utils.debounce(renderFilteredCards)();
  }

  function filterByDefault() {
    dataToBeFiltered = dependencies.data.SERVER_DATA;
    FiltersState['bar-js'] = dependencies.data.START_VCPU_COUNT;
    var callback = FilterFunction['bar-js'];
    var filterValue = FiltersState['bar-js'];
    filterData(callback, filterValue);
    renderFilteredCards();
  }

  window.filters = {
    filterByDefault: filterByDefault
  };
})();
'use strict';

(function () {
  var dependencies = {
    data: window.data,
    backend: window.backend,
    message: window.message,
    cards: window.cards,
    filters: window.filters
  };
  var METHOD = 'GET';
  var CATALOG = document.querySelector(".".concat(dependencies.data.CATALOG_CLASS));
  var LOADER = CATALOG.querySelector("#".concat(dependencies.data.LOADER_ID));
  dependencies.backend.load(onLoad, onError, METHOD);

  function onLoad(response) {
    CATALOG.removeChild(LOADER);
    dependencies.data.SERVER_DATA = JSON.parse(response);
    dependencies.filters.filterByDefault();
  }

  function onError(error) {
    CATALOG.removeChild(LOADER);
    dependencies.message.showErrorMessage(error);
  }
})();