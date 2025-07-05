declare module 'mjml' {
  interface MJMLParseResults {
    html: string;
    errors: string[];
  }

  function mjml2html(mjml: string): MJMLParseResults;

  export = mjml2html;
} 