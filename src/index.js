class ToDoListModel {
    baseURL = 'https://todo.hillel.it';

    #getToken = () => localStorage.getItem('Access Token');

    async auth(login, password) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({ value: login + password })
        });

        const result = await response.json();
        localStorage.setItem('Access Token', result.access_token);
    }

    async getNotes() {
        const response = await fetch(`${this.baseURL}/todo`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${this.#getToken()}`
            },
        });

        return await response.json();
    }

    async addNote(value) {
        const priority = 1;
        const response = await fetch(`${this.baseURL}/todo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${this.#getToken()}`
            },
            body: JSON.stringify({ value, priority })
        });

        return await response.json();
    }

    async removeNote(id) {
        await fetch(`${this.baseURL}/todo/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${this.#getToken()}`
            }
        });
    }

    async updateNote(id, value) {
        const priority = 1;
        await fetch(`${this.baseURL}/todo/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: `Bearer ${this.#getToken()}`
            },
            body: JSON.stringify({ value, priority })
        });
    }

    async toggleComplete(id) {
        await fetch(`${this.baseURL}/todo/${id}/toggle`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${this.#getToken()}`
            }
        });
    }

    async getStatistic() {
        const notes = await this.getNotes();
        const completed = notes.filter(item => item.checked).length;
        return {
            total: notes.length,
            completed
        };
    }

    async isUnique(value) {
        const notes = await this.getNotes();
        return !notes.find(note => note.value === value);
    }
}

class ToDoListView {
    todo = document.querySelector('.todo');
    list = document.querySelector('.todo__list');
    modal = document.querySelector('.popup__content');

    constructor() {
        this.createLoginForm();
        this.closePopUp();
    }

    createLoginForm() {
        const template = `<form id="login__form">
        <input type="text" name="text" placeholder="Login" class="input" required>
        <input type="password" name="text" placeholder="Password" class="input" required>
        <input type="submit" value="Sign in" class="button todo__button">
        </form> `;
        this.showPopUp(template);
    }

    showAllNotes(notes) {
        this.modal.innerHTML = '';
        document.body.classList.remove('modal_active');
        this.todo.style.display = 'block';
        notes.forEach(note => {
            const template = `<li class="todo__item ${note.checked ? 'todo__item_completed' : ''}" 
            data-id="${note._id}">
            <div class="todo__content">${note.value}</div>
            <span class="edit"></span><span class="delete"></span>
            </li>`;
            this.list.innerHTML += template;
        });
    }

    addNote(object) {
        const $error = document.querySelector('#todo__form .error');
        $error.innerHTML = '';
        const $item = document.createElement('li');
        $item.classList.add('todo__item');
        $item.dataset.id = object._id;
        const template = `<div class="todo__content">${object.value}</div>
        <span class="edit"></span><span class="delete"></span>`;
        $item.innerHTML = template;
        this.list.prepend($item);
    }

    removeNote(id) {
        this.list.querySelector(`[data-id='${id}']`).remove();
    }

    updateNote(id, text) {
        const $error = document.querySelector('#todo__form_edit .error');
        $error.innerHTML = '';
        this.list.querySelector(`[data-id='${id}'] .todo__content`).textContent = text;
    }

    createEditForm(id) {
        const currentValue = this.list.querySelector(`[data-id='${id}'] .todo__content`).textContent;
        const template = `<form id="todo__form_edit" data-id="${id}">
        <input type="text" name="text" value="${currentValue}" class="input" required>
        <div class="error"></div>
        <input type="submit" value="Edit item" class="button todo__button">
        </form> `;
        this.showPopUp(template);
    }

    toggleComplete(id) {
        this.list.querySelector(`[data-id='${id}']`).classList.toggle('todo__item_completed');
    }

    showStatistic(object) {
        let content = '';
        for (const key in object) {
            content += `<p><b>${key}</b>: ${object[key]}</p>`;
        }
        this.showPopUp(content);
    }

    showError = (form, message) => {
        const $errorBlock = form.querySelector('.error');
        $errorBlock.innerHTML = message;
    }

    showPopUp(content) {
        document.body.classList.add('modal_active');
        this.modal.innerHTML = content;
    }

    closePopUp() {
        const $close = document.querySelector('.popup__close');
        $close.addEventListener('click', () => {
            this.modal.innerHTML = '';
            document.body.classList.remove('modal_active');
        });
    }
}

class ToDoListControler {
    createForm = document.querySelector('#todo__form');
    list = document.querySelector('.todo__list');
    statisticBtn = document.querySelector('.button_statistic');

    constructor() {
        this.model = new ToDoListModel();
        this.view = new ToDoListView();
        this.initLoginFormListener();
        this.initCreateFormListener();
        this.initListListener();
        this.initStatisticListener();
    }

    initLoginFormListener() {
        const loginForm = document.querySelector('#login__form');
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const [ login, password ] = [...formData.values()];

            if (login.trim() && password.trim()) {
                await this.model.auth(login, password);
                const notes = await this.model.getNotes();
                this.view.showAllNotes(notes);
            }
        });
    }

    initCreateFormListener() {
        this.createForm.addEventListener('submit', async e => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const [ text ] = [...formData.values()];

            if (text.trim()) {
                if ( await this.model.isUnique(text)) {
                    const note = await this.model.addNote( text );
                    this.view.addNote(note);
                    e.target.reset();
                } else {
                    this.view.showError(this.createForm, 'Please enter unique value');
                }
            }
        });
    }

    initUpdateFormListener() {
        const updateForm = document.querySelector('#todo__form_edit');
        updateForm.addEventListener('submit', async e => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const [ text ] = [...formData.values()];
            const { id } = e.target.dataset;

            if (text.trim()) {
                if (await this.model.isUnique(text)) {
                    this.model.updateNote(id, text );
                    this.view.updateNote(id, text);
                } else {
                    this.view.showError(updateForm, 'Please enter unique value');
                }
            }
        });
    }

    initListListener() {
        this.list.addEventListener('click', (e) => {
            const $item = e.target.closest('li');
            const id = +$item.dataset.id;

            if (e.target.className === 'delete') {
                this.model.removeNote(id);
                this.view.removeNote(id);
            }

            if (e.target.className === 'todo__content') {
                this.model.toggleComplete(id);
                this.view.toggleComplete(id);
            }

            if (e.target.className === 'edit') {
                this.view.createEditForm(id);
                this.initUpdateFormListener();
            }
        });
    }

    initStatisticListener() {
        this.statisticBtn.addEventListener('click', async () => {
            const statistic = await this.model.getStatistic();
            this.view.showStatistic(statistic);
        });
    }
}

new ToDoListControler();