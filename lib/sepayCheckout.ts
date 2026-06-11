export function submitSepayCheckout(
  checkoutUrl: string,
  formFields: Record<string, string | number>
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;

  Object.entries(formFields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
