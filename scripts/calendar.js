const usersListApiUrl = {
  url: "https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/users",
  file: 'files/users.json'
}
const tasksListApiUrl = {
  url: "https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/tasks",
  file: 'files/tasks.json'
}

const presentDay = new Date()

const amountDays = {
  oneDay: 1, //
  threeDay: 3, //
  oneWeek: 7,
  twoWeeks: 14
}

//стартовое состояние календаря 1 неделя
let currentOptionsNumberDays = amountDays.oneWeek

let lastShowDate

function initLoader() {
  let templateLoader = document
    .querySelector('.loader-template')
    .content.querySelector('.loader')
    .cloneNode(true)
  document
  templateLoader.classList.add('show');

  document.body.append(templateLoader)
}

let intervalIdLoader

function spinningtLoader(startWidth, endWidth, interval) {
  return function (staus) {
    let loaderText = document.querySelector('.loader__text')
    let loaderScale = document.querySelector('.loader__scale')
    let count = startWidth
    if (!staus) {
      clearInterval(intervalIdLoader)
      return
    }
    if (staus) {
      const loading = () => {
        loaderText.textContent = `${count}%`
        loaderScale.style.width = `${count}%`
        if (count == endWidth) return
        count++
      }

      intervalIdLoader = setInterval(loading, interval)
    }
  }
}

let startLoader = spinningtLoader(0, 99, 30)

function changeDisplay(div) {
  div.classList.toggle('hide');
  div.classList.toggle('show');
}

//получаем данные
async function requestApi(way) {
  try {
    let resp = await fetch(way.url);

    if (resp.ok) {
      let data = await resp.json();
      return data;
    }

    throw 'status is not "OK"';
  } catch (e) {
    //берем из файлов, если сервер не доступен
    let resp = await fetch(way.file);

    if (!resp.ok) {
      throw e;
    }

    let data = await resp.json();
    return data;
  }
}

//инициализации страницы
async function onInit() {
  let divWrapper = document.querySelector('.wrapper')
  let divLodaer = document.querySelector('.loader')

  startLoader(true)

  const [dataUsers, dataTasks] = await Promise.all([requestApi(usersListApiUrl), requestApi(tasksListApiUrl)])

  startLoader(false)

  // divLodaer.remove()
  changeDisplay(divLodaer)
  changeDisplay(divWrapper)

  // console.log(dataUsers, dataTasks)

  //заполняем тело таблицы
  function showDataCalendare(users, tasks) {
    return function (days, date) {
      clearBodyTable()
      let widthSize = 100 / (days + 1)
      let calendarList = document.querySelector('.calendar__list')

      users.forEach(user => {

        let templateBody = document
          .querySelector('.calendar__list-user-template')
          .content.querySelector('.calendar__list-user')
          .cloneNode(true)

        templateBody = showUsers(user, templateBody, widthSize)
        templateBody = showTasks(user, tasks, templateBody, widthSize, days, date)

        calendarList.append(templateBody)
      });
    }
  }

  //заполненеия фио
  function showUsers(user, templateBody, widthSize) {
    let divUser = templateBody.querySelector('.calendar__list-user-cell-name')
    divUser.style = `min-width:${widthSize}%;`
    divUser.id = user.id
    divUser.textContent = `${user.surname ?? ''} ${user.firstName ? user.firstName[0] + '.' : ''} ${user.secondName ? user.secondName[0] + '.' : ''}`
    return templateBody
  }


  //заполнение строки задачи пользователя 
  function showTasks(user, tasks, templateBody, widthSize, days, date) {
    let userTask = tasks.filter(task => task.executor === user.id)
    // console.log(userTask)
    let stepDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    let endDate = new Date(stepDate)
    endDate.setDate(stepDate.getDate() + days)
    let divRow = templateBody.querySelector('.calendar__list-user-row')
    let arrAddedTasks = []
    while (stepDate.getDate() != endDate.getDate()) {
      let divTask = document.createElement("div")
      divTask.className = 'calendar__list-user-cell-task'
      divTask.style = `flex-basis: ${widthSize}%;`
      let startDateDay = new Date(stepDate.getFullYear(), stepDate.getMonth(), stepDate.getDate())
      let endDateDay = new Date(stepDate.getFullYear(), stepDate.getMonth(), stepDate.getDate() + 1)
      if (dateComparison(startDateDay, presentDay, endDateDay)) divTask.classList.add('current-day')
      if (!userTask || !userTask.length) {
        divRow.append(divTask)
        stepDate.setDate(stepDate.getDate() + 1)
        continue
      }
      userTask.forEach(task => {
        let startDateTaskArrNum = (task.planStartDate.split('-')).map(el => Number(el))
        let endDateTaskArrNum = (task.planEndDate.split('-')).map(el => Number(el))
        let startDateTask = new Date(startDateTaskArrNum[0], startDateTaskArrNum[1] - 1, startDateTaskArrNum[2])
        let endDateTask = new Date(endDateTaskArrNum[0], endDateTaskArrNum[1] - 1, endDateTaskArrNum[2])

        if (!dateComparison(startDateTask, stepDate, endDateTask)) {
          return
        }

        let taskObj = arrAddedTasks.find(el => el.id === task.id)
        if (taskObj) {
          return
        }
        //расчитываем количество дней длительности задачи от текущей даты расчета
        //к конечной даты задачи прибавляем день для правильности расчета
        let amountDaysMS = (endDateTask >= endDate ? endDate : endDateTask.setDate(endDateTask.getDate() + 1)) - stepDate
        let newObjTask = {
          id: task.id,
          amountDays: amountDaysMS / (3600 * 24 * 1000),
          positionNum: arrAddedTasks.length
        }
        arrAddedTasks.push(newObjTask)
        let newDivTaskName = document.createElement("div")
        let textDiv = document.createElement("div")
        textDiv.className = 'calendar__list-user-cell-task-name-text '
        textDiv.textContent = task.subject
        newDivTaskName.append(textDiv)
        newDivTaskName.id = task.id
        newDivTaskName.className = 'calendar__list-user-cell-task-name'
        if ((endDateTask < presentDay) && (task.status === 1)) newDivTaskName.classList.add('failed-task')
        if (task.status === 0) newDivTaskName.classList.add('success-task') //не понял по какому признаку считать задачу закрытой
        divTask.append(newDivTaskName)
        newDivTaskName.style = `width:calc(${newObjTask.amountDays * 100}% + ${newObjTask.amountDays * 2 - 2}px); top:${20 * newObjTask.positionNum}px;`

      })

      divRow.append(divTask)
      stepDate.setDate(stepDate.getDate() + 1)
    }
    divRow.style = `height: ${arrAddedTasks.length * 20}px;`
    return templateBody
  }

  let creatBodyInTable = showDataCalendare(dataUsers, dataTasks)

  creatBodyInTable(currentOptionsNumberDays, getMonday(new Date()))

  //заполняем строку с датами
  function showDate(days, date) {
    clearRowHeader()

    let stepDate = new Date(date)
    // let flexSize = `flex-basis: ${100 / (days + 1)}%`
    let widthSize = 100 / (days + 1)

    let templateDate = document
      .querySelector('.calendar__table-head-row-template')
      .content.querySelector('.calendar__table-head-row')
      .cloneNode(true)

    let divHeadNull = templateDate.querySelector('.calendar__table-head-cell-null')
    divHeadNull.style = `min-width:${widthSize}%;`

    let endDate = new Date(stepDate)
    endDate.setDate(stepDate.getDate() + days)
    let nameMonth = getDayMount(stepDate)
    let extraMonth
    while (stepDate.getDate() != endDate.getDate()) {
      if (nameMonth !== getDayMount(stepDate)) extraMonth = getDayMount(stepDate)
      let divHeadDate = document.createElement("div")
      divHeadDate.className = 'calendar__table-head-cell-date'
      divHeadDate.id = stepDate
      // divHeadDate.textContent = `${stepDate.getDate()}.${stepDate.getMonth() + 1}. \n
      // ${stepDate.getFullYear()}`
      divHeadDate.textContent = `${stepDate.getDate()} ${getDayWeek(stepDate)}`
      divHeadDate.style = `flex-basis: ${widthSize}%`

      let startDateDay = new Date(stepDate.getFullYear(), stepDate.getMonth(), stepDate.getDate())
      let endDateDay = new Date(stepDate.getFullYear(), stepDate.getMonth(), stepDate.getDate() + 1)
      if (dateComparison(startDateDay, presentDay, endDateDay)) {
        divHeadDate.classList.add('current-day')
      }

      templateDate.append(divHeadDate)

      stepDate.setDate(stepDate.getDate() + 1)
    }

    divHeadNull.textContent = extraMonth ? `${nameMonth} | ${extraMonth}` : `${nameMonth}`

    document.querySelector('.calendar__table-head')
      .append(templateDate)

    lastShowDate = stepDate
  }

  showDate(currentOptionsNumberDays, getMonday(new Date()))

  //навигация календаря
  function createHeadInTable(action) {
    let newStartDate = new Date(lastShowDate)
    switch (action) {
      case 'left':
        newStartDate.setDate(lastShowDate.getDate() - (2 * currentOptionsNumberDays))
        showDate(currentOptionsNumberDays, newStartDate)
        creatBodyInTable(currentOptionsNumberDays, newStartDate)
        break
      case 'today':
        let newDate = new Date()
        let today = getMonday(newDate)
        showDate(currentOptionsNumberDays, today)
        creatBodyInTable(currentOptionsNumberDays, today)
        break
      case 'right':
        newStartDate.setDate(lastShowDate.getDate())
        showDate(currentOptionsNumberDays, newStartDate)
        creatBodyInTable(currentOptionsNumberDays, newStartDate)
        break
    }
  }

  //смена количества отображаемых дней
  function changeViewDays() {
    let changeView = document.getElementById('changeView')
    let currentVariant = changeView.attributes.id_variant.nodeValue
    let newVariant
    switch (currentVariant) {
      case 'oneWeek':
        newVariant = 'twoWeeks'
        changeView.textContent = 'Одна неделя'
        break
      case 'twoWeeks':
        newVariant = 'oneWeek'
        changeView.textContent = 'Две недели'
        break
    }
    changeView.setAttribute("id_variant", newVariant)
    let dateStartCalendare = new Date(lastShowDate)
    dateStartCalendare.setDate(dateStartCalendare.getDate() - currentOptionsNumberDays)
    currentOptionsNumberDays = amountDays[newVariant]
    showDate(currentOptionsNumberDays, dateStartCalendare)
    creatBodyInTable(currentOptionsNumberDays, dateStartCalendare)
  }

  window.addEventListener('resize', () => {
    if (document.documentElement.clientWidth <= 699) {
      let changeView = document.getElementById('changeView')
      let newVariant
      newVariant = 'oneWeek'
      changeView.textContent = 'Две недели'
      changeView.setAttribute("id_variant", newVariant)
      let dateStartCalendare = new Date(lastShowDate)
      dateStartCalendare.setDate(dateStartCalendare.getDate() - currentOptionsNumberDays)
      currentOptionsNumberDays = amountDays[newVariant]
      showDate(currentOptionsNumberDays, dateStartCalendare)
      creatBodyInTable(currentOptionsNumberDays, dateStartCalendare)
    }
  })

  //определяем понедельник
  function getMonday(date) {
    if (date.getDay() === 1) return date
    date.setDate(date.getDate() - 1)
    return getMonday(date)
  }

  //чистим даты
  function clearRowHeader() {
    let cellHeader = document.querySelector('.calendar__table-head-row')
    if (cellHeader) cellHeader.remove()
  }

  //чистим записи календаря + пользователей
  function clearBodyTable() {
    let tableBody = document.querySelectorAll('.calendar__list-user')
    if (tableBody) tableBody.forEach(el => el.remove())
  }

  //функция для сравнения дат
  function dateComparison(startDate, currentDate, endDate) {
    if (currentDate >= startDate && endDate >= currentDate) return true

    return false
  }

  //добавляем события на кнопки
  let changeView = document.getElementById('changeView')

  changeView.getAttribute("id_variant")
  changeView.setAttribute("id_variant", "oneWeek")
  changeView.addEventListener("click", changeViewDays)

  let calendarBack = document.getElementById('calendarLeft')

  calendarBack.addEventListener("click", () => {
    createHeadInTable("left");
  });

  let calendarCurrent = document.getElementById('calendarToday')

  calendarCurrent.addEventListener("click", () => {
    createHeadInTable("today");
  });

  let calendarNext = document.getElementById('calendarRight')

  calendarNext.addEventListener("click", () => {
    createHeadInTable("right");
  });
}

function getDayWeek(date) {
  let numDay = date.getDay()
  let nameDay = ''
  switch (numDay) {
    case 1: nameDay = 'ПН'
      break
    case 2: nameDay = 'ВТ'
      break
    case 3: nameDay = 'СР'
      break
    case 4: nameDay = 'ЧТ'
      break
    case 5: nameDay = 'ПТ'
      break
    case 6: nameDay = 'СБ'
      break
    case 0: nameDay = 'ВС'
      break
  }
  return nameDay
}

function getDayMount(date) {
  let numMonth = date.getMonth()
  let nameMonth = ''
  switch (numMonth) {
    case 0: nameMonth = 'Январь'
      break
    case 1: nameMonth = 'Февраль'
      break
    case 2: nameMonth = 'Март'
      break
    case 3: nameMonth = 'Апрель'
      break
    case 4: nameMonth = 'Май'
      break
    case 5: nameMonth = 'Июнь'
      break
    case 6: nameMonth = 'Июль'
      break
    case 7: nameMonth = 'Август'
      break
    case 8: nameMonth = 'Сентябрь'
      break
    case 9: nameMonth = 'Октябрь'
      break
    case 10: nameMonth = 'Ноябрь'
      break
    case 11: nameMonth = 'Декабрь'
      break

  }
  return nameMonth
}

initLoader()

onInit()