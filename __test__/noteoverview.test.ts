import { noteoverview, logging } from "../src/noteoverview";
import * as YAML from "yaml";

describe("String escaping for md tables", function () {
  beforeEach(async () => {
    jest.spyOn(logging, "silly").mockImplementation(() => {});
    jest.spyOn(logging, "verbose").mockImplementation(() => {});
    jest.spyOn(logging, "info").mockImplementation(() => {});
  });

  it(`Escape |`, async () => {
    expect(await noteoverview.escapeForTable("Test | escape")).toBe(
      "Test \\| escape"
    );
  });

  it(`Escape ||`, async () => {
    expect(await noteoverview.escapeForTable("Test || escape")).toBe(
      "Test \\|\\| escape"
    );
  });

  it(`Escape multiple |`, async () => {
    expect(await noteoverview.escapeForTable("Test | with | more|escape")).toBe(
      "Test \\| with \\| more\\|escape"
    );
  });
});

describe("Date formating", function () {
  it(`Epoch 0 to empty string`, async () => {
    const epoch = 0;
    const dateFormat = "DD/MM/YYYY";
    const timeFormat = "hh:mm";
    expect(
      await noteoverview.getDateFormated(epoch, dateFormat, timeFormat)
    ).toBe("");
  });

  it(`Get time string`, async () => {
    const testDate = new Date(2021, 5, 21, 15, 30, 45);
    const epoch = testDate.getTime();
    const dateFormat = "DD/MM/YYYY";
    const timeFormat = "HH:mm";
    expect(
      await noteoverview.getDateFormated(epoch, dateFormat, timeFormat)
    ).toBe("21/06/2021 15:30");
  });
});

describe("Singel tests", function () {
  it(`humanFrendlyStorageSize`, async () => {
    const testCases = [
      [50, "50 Byte"],
      [1024, "1.00 KiB"],
      [1024 * 1024, "1.00 MiB"],
      [1024 * 1024 * 10, "10.00 MiB"],
      [1024 * 1024 * 1024 * 3, "3.00 GiB"],
      [1024 * 1024 * 1000 * 3, "2.93 GiB"],
    ];

    for (const t of testCases) {
      const input = Number(t[0]);
      const expected = t[1];
      const actual = await noteoverview.humanFrendlyStorageSize(input);
      expect(actual).toBe(expected);
    }
  });

  it(`remove last \\n from YAML block`, async () => {
    const settingsBlock =
      "search: tag:task\nfields: status, todo_due\nsort: todo_due ASC";
    const expected = "<!-- note-overview-plugin\n" + settingsBlock + "\n-->";
    const settings = YAML.parse(settingsBlock);
    const actual = await noteoverview.createSettingsBlock(settings);
    expect(actual).toBe(expected);
  });
});

describe("Get image nr X from body", function () {
  it(`with default settings`, async () => {
    let imageSettings = null;
    let imgStr = null;
    let body = `
        ![sda äö.png](:/f16103b064d9410384732ec27cd06efb)
        text
        ![ad762c6793d46b521cea4b2bf3f01b5e.png](:/a7f9ed618c6d427395d1ef1db2ee2000)
        text
        ![](:/766bf08661e51d3897e6314b56f4d113)  
        `;

    imgStr = await noteoverview.getImageNr(body, 1, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/f16103b064d9410384732ec27cd06efb' width='200' height='200'>`
    );

    imgStr = await noteoverview.getImageNr(body, 3, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/766bf08661e51d3897e6314b56f4d113' width='200' height='200'>`
    );

    imgStr = await noteoverview.getImageNr(body, 4, imageSettings);
    expect(imgStr).toBe(``);
  });

  it(`with settings`, async () => {
    let imageSettings = { width: 100, height: 300, exactnr: false };
    let imgStr = null;
    let body = `
        ![sda äö.png](:/f16103b064d9410384732ec27cd06efb)
        text
        ![ad762c6793d46b521cea4b2bf3f01b5e.png](:/a7f9ed618c6d427395d1ef1db2ee2000)
        text
        ![](:/766bf08661e51d3897e6314b56f4d113)  
        `;

    imgStr = await noteoverview.getImageNr(body, 1, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/f16103b064d9410384732ec27cd06efb' width='100' height='300'>`
    );

    imgStr = await noteoverview.getImageNr(body, 3, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/766bf08661e51d3897e6314b56f4d113' width='100' height='300'>`
    );

    imgStr = await noteoverview.getImageNr(body, 4, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/766bf08661e51d3897e6314b56f4d113' width='100' height='300'>`
    );
  });
});

describe("get MD excerpt", function () {
  it(`remove ~~ ++ ==`, async () => {
    const settings = { maxlength: 100 };
    const md = "test ~~test~~ test ==test== test ++test++ test";
    const expected = "test test test test test test test";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`stripe`, async () => {
    const settings = { maxlength: 100 };
    const md = "# h1\nsadkj<br>dsak![](:/asdasdasd)\nkfdsj **dsa** asd\n ## h2";
    const expected = "h1 sadkjdsak kfdsj dsa asd h2";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`max length`, async () => {
    const settings = { maxlength: 20 };
    const md = "# h1\nsadkj<br>dsak![](:/asdasdasd)\nkfdsj **dsa** asd\n ## h2";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual.length).toBe(settings.maxlength + 3);
  });

  it(`remove image name`, async () => {
    const settings = { maxlength: 200, imagename: false };
    const md =
      "some text with a ![Python.svg](:/775dab2e3e234a9a89975db92a365688) image ![test dsa.png](:/775dab2e3e234a9a89975db92a365688)";
    const expected = "some text with a image";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`don't remove image name`, async () => {
    const settings = { maxlength: 200, imagename: true };
    const md =
      "some text with a ![Python.svg](:/775dab2e3e234a9a89975db92a365688) image ![test dsa.png](:/775dab2e3e234a9a89975db92a365688)";
    const expected = "some text with a Python.svg image test dsa.png";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });
});
