currentWindow = "";

window.addEventListener("load", () => {
  start();
  const navButton = document.getElementById("nav-button");

  document.getElementById("auth").addEventListener("submit", (e) => {
    e.preventDefault();
    authProceed();
  });

  navButton.addEventListener("click", () => {
    if (navButton.textContent === "Previous") {
      previous();
    } else if (navButton.textContent === "Back") {
      back();
    }
  });

  document.getElementById("linkit").addEventListener("click", () => {
    changeWindow("link");
  });

  document.getElementById("shareathought").addEventListener("click", () => {
    changeWindow("thought");
  });

  document.getElementById("link").addEventListener("submit", (e) => {
    e.preventDefault();
    sendLink();
  });

  document.getElementById("thought").addEventListener("submit", (e) => {
    e.preventDefault();
    sendThought();
  });
});

/* Wanted to change popup border */
// async function popupBorder() {
//   let val = await browser.theme.getCurrent();
//   val.colors.popup_border = "transparent";
//   await browser.theme.update(val);
//   return;
// }

async function start() {
  await browser.storage.local.get("token").then((value) => {
    if (value["token"]) {
      document.getElementById("main").classList.replace("hidden", "content");
      document.getElementById("home").classList.replace("hidden", "content");
    } else {
      document.getElementById("auth").classList.replace("hidden", "content");
    }
  });
  return;
}

async function authProceed() {
  document.getElementById("loader").classList.replace("hidden", "content");
  document.getElementById("auth").classList.replace("content", "hidden");
  const apiToken = document.getElementById("api").value;

  let valueInProject = false;

  await fetch("https://api.todoist.com/rest/v2/projects", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      data.forEach((val) => {
        if (val.name === "thoughts extension") {
          valueInProject = true;
          const project_id = val.id;

          let values = {};
          values["token"] = apiToken;
          values["project_id"] = project_id;
          browser.storage.local.set(values);

          document
            .getElementById("loader")
            .classList.replace("content", "hidden");
          document
            .getElementById("main")
            .classList.replace("hidden", "content");
          document
            .getElementById("home")
            .classList.replace("hidden", "content");
          return;
        }
      });
    })
    .catch((error) => {
      document.getElementById("loader").classList.replace("content", "hidden");
      errormessage(error);
      return;
    });

  if (valueInProject === true) {
    return;
  }

  await fetch("https://api.todoist.com/rest/v2/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": "$(uuidgen)",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      name: "thoughts extension",
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      const project_id = data.id;

      let values = {};
      values["token"] = apiToken;
      values["project_id"] = project_id;
      browser.storage.local.set(values);

      document.getElementById("loader").classList.replace("content", "hidden");
      document.getElementById("main").classList.replace("hidden", "content");
      document.getElementById("home").classList.replace("hidden", "content");
    })
    .catch((error) => {
      errormessage(error);
      return;
    });

  return;
}

function errormessage(err) {
  document.getElementById("loader").classList.replace("content", "hidden");
  document.getElementById("error-message").textContent = err;
  document
    .getElementById("error-content")
    .classList.replace("hidden", "content");

  return;
}

function back() {
  document.getElementById(currentWindow).classList.replace("content", "hidden");
  document.getElementById("nav-button").textContent = "Previous";
  currentWindow = "";
  document.getElementById("home").classList.replace("hidden", "content");
  return;
}

async function previous() {
  document.getElementById("home").classList.replace("content", "hidden");
  document.getElementById("nav-button").classList.replace("show", "hidden");

  if (window.hasRun) {
    currentWindow = "previous";
    document.getElementById("nav-button").textContent = "Back";
    document.getElementById("nav-button").classList.replace("hidden", "show");
    document.getElementById("previous").classList.replace("hidden", "content");
    return;
  }
  window.hasRun = true;

  document.getElementById("loader").classList.replace("hidden", "content");

  const apikey = await browser.storage.local.get("token");
  if (!apikey["token"]) {
    errormessage("Problem regarding retrieving value of token from storage");
    return;
  }
  const project_id = await browser.storage.local.get("project_id");
  if (!project_id["project_id"]) {
    errormessage(
      "Problem regarding retrieving value of project id from storage",
    );
    return;
  }

  await fetch(
    `https://api.todoist.com/rest/v2/tasks?project_id=${project_id["project_id"]}`,
    {
      headers: {
        Authorization: `Bearer ${apikey["token"]}`,
      },
    },
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.length === 0) {
        document
          .getElementById("loader")
          .classList.replace("content", "hidden");
        currentWindow = "previous";
        document.getElementById("nav-button").textContent = "Back";

        let p = document.createElement("p");

        p.textContent = "No thoughts logged";

        document.getElementById("previous").appendChild(p);

        document
          .getElementById("nav-button")
          .classList.replace("hidden", "show");
        document
          .getElementById("previous")
          .classList.replace("hidden", "content");
        return;
      }

      data.forEach((task) => {
        const regex = /\[(.*?)\]\((.*?)\)/;
        let matches = task.content.match(regex);
        const previous = document.getElementById("previous");

        if (matches) {
          let newDiv = document.createElement("div");
          let p = document.createElement("p");
          let link = document.createElement("a");

          link.setAttribute("href", matches[2]);
          link.textContent = matches[1];

          if (task.description) {
            p.textContent = task.description;
          }
          newDiv.appendChild(link);
          newDiv.appendChild(p);
          newDiv.classList.add("written");
          previous.appendChild(newDiv);
        } else {
          let newDiv = document.createElement("div");
          newDiv.classList.add("written");
          newDiv.textContent = task.content;
          previous.appendChild(newDiv);
        }

        document
          .getElementById("loader")
          .classList.replace("content", "hidden");
        currentWindow = "previous";
        document.getElementById("nav-button").textContent = "Back";
        document
          .getElementById("nav-button")
          .classList.replace("hidden", "show");
        previous.classList.replace("hidden", "content");
      });
    })
    .catch((error) => {
      errormessage(error);
      return;
    });

  return;
}

async function changeWindow(wid) {
  document.getElementById("home").classList.replace("content", "hidden");
  if (wid === "link") {
    document.getElementById("main").classList.replace("content", "hidden");
    document.getElementById("loader").classList.replace("hidden", "content");

    await browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        const title = tabs[0].title;
        const link = tabs[0].url;

        document.getElementById("linkinput").value = `[${title}](${link})`;
        document
          .getElementById("loader")
          .classList.replace("content", "hidden");
        document.getElementById("main").classList.replace("hidden", "content");
      })
      .catch(() => {
        errormessage("Something went wrong");
        return;
      });
  }

  currentWindow = wid;
  document.getElementById("nav-button").textContent = "Back";
  document.getElementById(wid).classList.replace("hidden", "content");
  return;
}

async function sendLink() {
  document.getElementById("link").classList.replace("content", "hidden");
  document.getElementById("main").classList.replace("content", "hidden");
  document.getElementById("loader").classList.replace("hidden", "content");
  currentWindow = "";

  let content = document.getElementById("linkinput").value;
  let description = document.getElementById("descriptioninput").value;

  let apikey = await browser.storage.local.get("token");
  if (!apikey["token"]) {
    errormessage("Problem regarding retrieving value of token from storage");
    return;
  }
  let project_id = await browser.storage.local.get("project_id");
  if (!project_id["project_id"]) {
    errormessage(
      "Problem regarding retrieving value of project id from storage",
    );
    return;
  }

  await fetch(
    `https://api.todoist.com/rest/v2/tasks?project_id=${project_id["project_id"]}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apikey["token"]}`,
        "Content-Type": "application/json",
        "X-Request-Id": "$(uuidgen)",
      },
      body: JSON.stringify({
        content: content,
        description: description,
      }),
    },
  )
    .then((response) => response.json())
    .then(() => {
      document.getElementById("linkinput").value = "";
      document.getElementById("descriptioninput").value = "";

      document.getElementById("nav-button").textContent = "Previous";
      document.getElementById("loader").classList.replace("content", "hidden");
      document.getElementById("main").classList.replace("hidden", "content");
      document.getElementById("home").classList.replace("hidden", "content");
      return;
    })
    .catch(() => {
      document.getElementById("linkinput").value = "";
      document.getElementById("descriptioninput").value = "";

      errormessage(
        "Oops, we encountered an error while trying to share this link",
      );
      return;
    });
}

async function sendThought() {
  document.getElementById("thought").classList.replace("content", "hidden");
  document.getElementById("main").classList.replace("content", "hidden");
  document.getElementById("loader").classList.replace("hidden", "content");
  currentWindow = "";

  let content = document.getElementById("textinput").value;

  let apikey = await browser.storage.local.get("token");
  if (!apikey["token"]) {
    errormessage("Problem regarding retrieving value of token from storage");
    return;
  }
  let project_id = await browser.storage.local.get("project_id");
  if (!project_id["project_id"]) {
    errormessage(
      "Problem regarding retrieving value of project id from storage",
    );
    return;
  }

  await fetch(
    `https://api.todoist.com/rest/v2/tasks?project_id=${project_id["project_id"]}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apikey["token"]}`,
        "Content-Type": "application/json",
        "X-Request-Id": "$(uuidgen)",
      },
      body: JSON.stringify({
        content: content,
      }),
    },
  )
    .then((response) => response.json())
    .then(() => {
      document.getElementById("textinput").value = "";
      document.getElementById("nav-button").textContent = "Previous";
      document.getElementById("loader").classList.replace("content", "hidden");
      document.getElementById("main").classList.replace("hidden", "content");
      document.getElementById("home").classList.replace("hidden", "content");
      return;
    })
    .catch(() => {
      document.getElementById("textinput").value = "";
      errormessage(
        "Oops, there was an error while trying to share your message",
      );
      return;
    });
}
