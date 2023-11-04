import { default as UrlPattern } from "url-pattern";
import { routes } from "../utils/routesList.mjs";

let absURL = "";

function setAbsURL(url) {
  absURL = url;
}

function addLink(linkName, params) {
  this.links = this.links || [];
  this.links.push(getLinkCJFormat(linkName, params));
}

function setHref(link, params) {
  let route = routes[link];
  let urlPat = new UrlPattern(route.href);
  this.href = absURL + urlPat.stringify(params);
}

let CJItem = {};

CJItem.addLink = addLink;

CJItem.addData = function (name, value, prompt, type) {
  this.data = this.data || [];
  let d = { name, value, prompt, type };
  this.data.push(d);
};

CJItem.setHref = setHref;

function createCJItem() {
  return Object.create(CJItem);
}

let CJ = {
  collection: {
    version: "1.0",
  },
};

CJ.setHref = setHref;
CJ.addLink = addLink;
CJ.addItem = function (item) {
  this.items = this.items || [];
  this.items.push(item);
};

function createCJ() {
  return Object.create(CJ);
}

function parseTemplate(json) {
  console.log(json);
  if (
    typeof json === "undefined" ||
    typeof json.template === "undefined" ||
    typeof json.template.data === "undefined" ||
    !Array.isArray(json.template.data)
  ) {
    throw new Error("Los datos no están en formato CJ");
  }

  var data = json.template.data.reduce(function (a, b) {
    a[b.name] = b.value;
    return a;
  }, {});

  return data;
}

function getLinkCJFormat(link, params) {
  let route = routes[link];
  let urlPat = new UrlPattern(route.href);
  return {
    // Falta origin
    href: absURL + urlPat.stringify(params),
    rel: route.rel,
    prompt: route.prompt,
  };
}

export { setAbsURL, parseTemplate, createCJ, getLinkCJFormat, createCJItem };
