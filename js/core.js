"use strict";

const database = [
	{
		"name": "Party potion",
		"icon": "wine-bottle.svg",
		"description":
			"Ooh, fancy. A tasty way to celebrate victories and become an easy target for the victories of others.",
		"volume": 10,
		"mass": 50
	},
	{
		"name": "Fairy dragon scale",
		"icon": "dragon.svg",
		"description":
			"Have you ever seen a fairy dragon? Its shimmering scale is super light!",
		"volume": 531,
		"mass": 200
	},
	{
		"name": "Small tower bell",
		"icon": "bell.svg",
		"description":
			"This tower bell is relatively small, but still difficult to carry.",
		"volume": 768,
		"mass": 4729
	},
	{
		"name": "Trade weight",
		"icon": "weight-hanging.svg",
		"description":
			"An object of known mass to be used with a weighing scale.",
		"volume": 4,
		"mass": 100
	}
];

const source_tag = "source";
const row_size = 10;
const min_rows = 4;
const row_height = 56;

const max_volume = 1000;
const max_mass = 5000;

const inventory = document.getElementById("inventory");
const inventory_ul = inventory.querySelector("ul");
const inventory_volume = inventory.querySelector(".volume");
const inventory_mass = inventory.querySelector(".mass");

const tooltip = document.getElementById("tooltip");
const tooltip_h3 = tooltip.querySelector("h3");
const tooltip_p = tooltip.querySelector("p");
const tooltip_volume = tooltip.querySelector(".volume");
const tooltip_mass = tooltip.querySelector(".mass");

function show_tooltip(e) {
	const index = e.currentTarget.dataset["index"];

	tooltip_h3.textContent = database[index]["name"];
	tooltip_p.textContent = database[index]["description"];
	tooltip_volume.textContent = database[index]["volume"];
	tooltip_mass.textContent = database[index]["mass"];

	tooltip.classList.remove("hidden");
}

function hide_tooltip(e) {
	tooltip.classList.add("hidden");
}

function update_inventory_volume(difference) {
	inventory_volume.dataset["volume"] =
		Number(inventory_volume.dataset["volume"]) + difference;
	inventory_volume.textContent =
		inventory_volume.dataset["volume"] + " / " + max_volume;
}

function update_inventory_mass(difference) {
	inventory_mass.dataset["mass"] =
		Number(inventory_mass.dataset["mass"]) + difference;
	inventory_mass.textContent =
		inventory_mass.dataset["mass"] + " / " + max_mass;
}

function reset_inventory_item(item) {
	const index = item.dataset["index"];

	item.parentNode.classList.add("empty");
	item.parentNode.replaceChild(create_empty_item(), item);

	update_inventory_volume(-Number(database[index]["volume"]));
	update_inventory_mass(-Number(database[index]["mass"]));

	const slots = inventory_ul.querySelectorAll("li");
	let empty_slot_counter = 0;

	// Count the consecutive empty slots from the end of the inventory
	for (let i = slots.length - 1; i >= row_size * (min_rows - 1); i--) {
		if (slots[i].classList.contains("empty") === true) {
			empty_slot_counter++;
			if (empty_slot_counter >= row_size * 2) {
				empty_slot_counter -= row_size;
				remove_last_row();
			}
		} else {
			break;
		}
	}
}

function delete_inventory_item(item) {
	hide_tooltip();
	reset_inventory_item(item);
}

function inventory_drag_start(e) {
	e.currentTarget.removeEventListener("dragenter", inventory_drag_enter);
	e.currentTarget.removeEventListener("dragover", inventory_drag_over);

	e.currentTarget.dataset["draggable"] = source_tag;
}

function inventory_drag_end(e) {
	delete e.currentTarget.dataset["draggable"];

	e.currentTarget.addEventListener("dragenter", inventory_drag_enter);
	e.currentTarget.addEventListener("dragover", inventory_drag_over);
}

function inventory_drag_enter(e) {
	// Make sure that the draggable item is valid
	const draggable =
		document.querySelector("[data-draggable=\"" + source_tag + "\"]");

	if (draggable !== null) {
		e.currentTarget.classList.add("drag-over");
	}
}

function inventory_drag_over(e) {
	// Accept only valid sources
	if (e.currentTarget.classList.contains("drag-over")) {
		e.preventDefault();
	}
}

function inventory_drag_leave(e) {
	e.currentTarget.classList.remove("drag-over");
}

function inventory_drop(e) {
	e.currentTarget.classList.remove("drag-over");

	const draggable =
		document.querySelector("[data-draggable=\"" + source_tag + "\"]");

	// Item is dropped in trash
	if (e.currentTarget.id === "trash") {
		delete_inventory_item(draggable);

		return;
	}

	const draggable_parent = draggable.parentNode;
	// If it exists, move the empty class
	if (e.currentTarget.parentNode.classList.contains("empty") === true) {
		draggable_parent.classList.add("empty");
		e.currentTarget.parentNode.classList.remove("empty");
	}
	// Switch the items around
	e.currentTarget.parentNode.replaceChild(draggable, e.currentTarget);
	draggable_parent.appendChild(e.currentTarget);
}

function click_inventory_item(e) {
	if (e.ctrlKey === true) {
		delete_inventory_item(e.currentTarget);
	}
}

function build_inventory_item(item, index) {
	item.setAttribute("src", "images/" + database[index]["icon"]);
	item.setAttribute("alt", database[index]["name"]);
	item.dataset["index"] = index;
	item.setAttribute("draggable", "true");
	item.addEventListener("mouseenter", show_tooltip);
	item.addEventListener("mouseleave", hide_tooltip);
	item.addEventListener("dragstart", inventory_drag_start);
	item.addEventListener("dragend", inventory_drag_end);
	item.addEventListener("click", click_inventory_item);
}

function click_loot_item(e) {
	const index = e.currentTarget.dataset["index"];
	const copies = e.shiftKey === true ? row_size : 1;

	for (let i = 0; i < copies; i++) {
		if (Number(inventory_volume.dataset["volume"]) +
			Number(database[index]["volume"]) > max_volume) {
			const span = e.currentTarget.parentNode.querySelector("span");
			span.textContent = "This is too large";
			span.classList.add("error");

			return;
		}

		if (Number(inventory_mass.dataset["mass"]) +
			Number(database[index]["mass"]) > max_mass) {
			const span = e.currentTarget.parentNode.querySelector("span");
			span.textContent = "This is too heavy";
			span.classList.add("error");

			return;
		}

		// Note: The empty slots size is before the item is added
		const empty_slots = inventory_ul.querySelectorAll("li.empty");
		const first_empty_slot = empty_slots[0];
		first_empty_slot.removeAttribute("class");
		const img = first_empty_slot.querySelector("img");
		build_inventory_item(img, index);

		update_inventory_volume(Number(database[index]["volume"]));
		update_inventory_mass(Number(database[index]["mass"]));

		if (empty_slots.length <= row_size) {
			add_row();
		}
	}
}

function create_empty_item() {
	const img = document.createElement("img");
	img.setAttribute("src", "//:0");
	img.setAttribute("alt", "");
	img.setAttribute("draggable", "false");

	img.addEventListener("dragenter", inventory_drag_enter);
	img.addEventListener("dragover", inventory_drag_over);
	img.addEventListener("dragleave", inventory_drag_leave);
	img.addEventListener("drop", inventory_drop);

	return img;
}

function add_slot() {
	const li = document.createElement("li");
	li.classList.add("empty");

	li.appendChild(create_empty_item());
	inventory_ul.appendChild(li);
}

function add_row() {
	for (let i = 0; i < row_size; i++) {
		add_slot();
	}

	inventory_scroll_down(undefined);
}

function remove_last_row() {
	const slots = inventory_ul.querySelectorAll("li");
	const target_index = slots.length - row_size - 1;

	for (let i = slots.length - 1; i > target_index; i--) {
		inventory_ul.removeChild(slots[i]);
	}
}

function inventory_scroll_up(e) {
	// The top value is the height of a row
	// This triggers the ul scroll event
	inventory_ul.scrollBy({ "top": -56, "left": 0, "behavior": "instant" });
}

function inventory_scroll_down(e) {
	// The top value is the height of a row
	// This triggers the ul scroll event
	inventory_ul.scrollBy({ "top": 56, "left": 0, "behavior": "instant" });
}

function inventory_scroll(e) {
	const scroll_up = document.getElementById("scroll-up");
	const scroll_down = document.getElementById("scroll-down");

	if (e.currentTarget.scrollTop === 0) {
		scroll_up.removeEventListener("click", inventory_scroll_up);
		scroll_up.classList.add("hidden");
	} else {
		scroll_up.classList.remove("hidden");
		scroll_up.addEventListener("click", inventory_scroll_up);
	}

	if (e.currentTarget.scrollTop ===
		(e.currentTarget.scrollHeight - e.currentTarget.offsetHeight)) {
		scroll_down.removeEventListener("click", inventory_scroll_down);
		scroll_down.classList.add("hidden");
	} else {
		scroll_down.classList.remove("hidden");
		scroll_down.addEventListener("click", inventory_scroll_down);
	}
}

function hide_restrictions(e) {
	const index = e.currentTarget.dataset["index"];
	const span = e.currentTarget.parentNode.querySelector("span");

	span.classList.remove("error");
	span.textContent = database[index]["name"];
}

function init() {
	const loot = document.getElementById("loot");
	const loot_ul = loot.querySelector("ul");

	for (let i = 0; i < database.length; i++) {
		const li = document.createElement("li");
		const img = document.createElement("img");
		const span = document.createElement("span");
		const text = document.createTextNode(database[i]["name"]);

		img.setAttribute("src", "images/" + database[i]["icon"]);
		img.setAttribute("alt", database[i]["name"]);
		img.setAttribute("draggable", "false");
		img.dataset["index"] = i;

		img.addEventListener("mouseenter", show_tooltip);
		img.addEventListener("mouseleave", hide_tooltip);
		img.addEventListener("mouseleave", hide_restrictions);
		img.addEventListener("click", click_loot_item);

		li.appendChild(img);
		span.appendChild(text);
		li.appendChild(span);
		loot_ul.appendChild(li);
	}

	inventory_ul.addEventListener("scroll", inventory_scroll);

	for (let i = 0; i < min_rows; i++) {
		add_row();
	}

	update_inventory_volume(0);
	update_inventory_mass(0);

	const trash = document.getElementById("trash");
	trash.addEventListener("dragenter", inventory_drag_enter);
	trash.addEventListener("dragover", inventory_drag_over);
	trash.addEventListener("dragleave", inventory_drag_leave);
	trash.addEventListener("drop", inventory_drop);
}

init();

