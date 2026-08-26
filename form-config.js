const isLocalPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname);

window.FOREVERLOVE_RSVP = Object.freeze({
  enabled: true,
  apiBaseUrl: isLocalPreview
    ? "http://127.0.0.1/api/v1"
    : "https://foreverlove.com.tw/api/v1",
  formKey: "form_jlqxjw36flfeunayo7z03tq3edyj2h8o",
  publishableKey: "pk_test_9bq5eplchgvylusgkyhgs6hwjsywiwxflhenyhdn"
});
