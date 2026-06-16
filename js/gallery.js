const galleryGrid =
  document.querySelector("#gallery-grid") ||
  document.querySelector("#galleryGrid");

const galleryStatus =
  document.querySelector("#gallery-status") ||
  document.querySelector("#galleryStatus");

const filterButtons = document.querySelectorAll(
  ".gallery-filters button, .gallery-filter button"
);

const modal = document.querySelector("#gallery-modal");
const modalImage = modal ? modal.querySelector("img") : null;
const modalTitle = modal ? modal.querySelector("#gallery-modal-title") : null;
const modalCloseButton = modal ? modal.querySelector(".gallery-modal-close") : null;

let galleryItems = [];
let lastFocusedElement = null;

const defaultCategoryNames = {
  nail: "네일",
  pedi: "패디",
  care: "케어",
  art: "이달의 아트",
};

const defaultTitles = {
  nail: "네일 시술 사례",
  pedi: "패디 시술 사례",
  care: "케어 시술 사례",
  art: "이달의 아트",
};

function formatMonth(month) {
  const match = /^(\d{4})-(\d{2})$/.exec(month || "");
  return match ? `${match[1]}년 ${Number(match[2])}월` : month || "";
}

function createImageFallback() {
  const fallback = document.createElement("div");
  fallback.className = "gallery-image-fallback";
  fallback.setAttribute("role", "img");
  fallback.setAttribute("aria-label", "이미지를 준비 중입니다");
  fallback.innerHTML = "<span>CHOCO NAIL</span><strong>이미지 준비 중</strong>";
  return fallback;
}

function handleImageError(image) {
  const imageButton = image.closest(".gallery-image-button");
  if (!imageButton) return;

  imageButton.disabled = true;
  imageButton.removeAttribute("aria-label");
  imageButton.replaceChildren(createImageFallback());
}

function normalizeItem(item) {
  const category = item.category || "nail";

  return {
    ...item,
    category,
    categoryName: item.categoryName || defaultCategoryNames[category] || "갤러리",
    title: item.title || defaultTitles[category] || "시술 사례",
    description: item.description || "",
    month: item.month || "",
    sortOrder: Number(item.sortOrder || 9999),
  };
}

function createGalleryCard(rawItem) {
  const item = normalizeItem(rawItem);

  const card = document.createElement("article");
  card.className = "gallery-card";

  const imageButton = document.createElement("button");
  imageButton.className = "gallery-image-button";
  imageButton.type = "button";
  imageButton.setAttribute("aria-label", `${item.title} 이미지 크게 보기`);

  const image = document.createElement("img");
  image.src = item.image;
  image.alt = `${item.title} 시술 사례`;
  image.width = 1280;
  image.height = 1280;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => handleImageError(image), { once: true });
  imageButton.append(image);

  if (modal && modalImage && modalTitle && modalCloseButton) {
    imageButton.addEventListener("click", () => openModal(item));
  }

  const body = document.createElement("div");
  body.className = "gallery-card-body";

  const meta = document.createElement("div");
  meta.className = "gallery-card-meta";

  const category = document.createElement("span");
  category.className = "gallery-category";
  category.textContent = item.categoryName;

  meta.append(category);

  if (item.month) {
    const month = document.createElement("time");
    month.dateTime = item.month;
    month.textContent = formatMonth(item.month);
    meta.append(month);
  }

  const title = document.createElement("h2");
  title.textContent = item.title;

  body.append(meta, title);

  if (item.description) {
    const description = document.createElement("p");
    description.textContent = item.description;
    body.append(description);
  }

  card.append(imageButton, body);
  return card;
}

function shuffleItems(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function renderGallery(category = "all") {
  if (!galleryGrid) return;

  let filteredItems = [];

  if (category === "all") {
  const categoryOrder = ["nail", "pedi", "art"];

  filteredItems = categoryOrder.flatMap((categoryName) =>
    galleryItems
      .filter((item) => item.category === categoryName)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  );
} else {
  filteredItems = galleryItems
    .filter((item) => item.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

  galleryGrid.replaceChildren(...filteredItems.map(createGalleryCard));

  if (galleryStatus) {
    galleryStatus.textContent = filteredItems.length
      ? `총 ${filteredItems.length}개의 시술 사례가 있습니다.`
      : "해당 카테고리의 시술 사례가 없습니다.";
  }
}
function openModal(item) {
  if (!modal || !modalImage || !modalTitle || !modalCloseButton) return;

  lastFocusedElement = document.activeElement;
  modalImage.src = item.image;
  modalImage.alt = `${item.title} 시술 사례 크게 보기`;
  modalTitle.textContent = item.title;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modalCloseButton.focus();
}

function closeModal() {
  if (!modal || !modalImage) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  modalImage.src = "";
  lastFocusedElement?.focus();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.classList.toggle("active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });

    renderGallery(button.dataset.category || "all");
  });
});

if (modalCloseButton) {
  modalCloseButton.addEventListener("click", closeModal);
}

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && modal.classList.contains("is-open")) {
    closeModal();
  }
});

if (!galleryGrid) {
  console.error(
    "갤러리 출력 영역을 찾지 못했습니다. gallery.html에 id가 gallery-grid 또는 galleryGrid인 요소가 필요합니다."
  );
} else {
  fetch("data/gallery-data.json")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        throw new Error("갤러리 데이터 형식이 올바르지 않습니다.");
      }

      galleryItems = data
        .filter((item) => item.visible === "Y")
        .map(normalizeItem)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      renderGallery();
    })
    .catch((error) => {
      console.error("Gallery data loading failed:", error);

      if (galleryStatus) {
        galleryStatus.textContent =
          "갤러리를 불러오지 못했습니다. data/gallery-data.json 경로와 JSON 문법을 확인해 주세요.";
        galleryStatus.classList.add("is-error");
      } else if (galleryGrid) {
        galleryGrid.innerHTML =
          '<p class="gallery-status is-error">갤러리를 불러오지 못했습니다. data/gallery-data.json 경로와 JSON 문법을 확인해 주세요.</p>';
      }
    });
}
