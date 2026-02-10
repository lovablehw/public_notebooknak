/*
  MANUAL CODE
  Do not modify this file!
 */

type HwAttributes = {
  viewId: number;
  queryId: number;
  queryName: string;
  reportName?: string;
}

type ReactHTMLElement = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

declare global {
  declare module "react" {
    namespace JSX {
      interface IntrinsicElements {
        'hw-host': ReactHTMLElement & {
          apiUrl: string;
          appName: string;
          clientId: string;
          externalId?: string;
          styles: string;
          darkMode?: boolean;
          documentServerUrl?: string;
          assets?: string;
        };
        'hw-grid-component': ReactHTMLElement & HwAttributes & { layoutId?: number };
        'hw-survey-component': ReactHTMLElement & HwAttributes;
        'hw-chatbot-component': ReactHTMLElement;
        'hw-info-widget-component': ReactHTMLElement & HwAttributes;
        'hw-graph-component': ReactHTMLElement & HwAttributes;
        'hw-timeline-component': ReactHTMLElement & HwAttributes;
        'hw-document-component': ReactHTMLElement & HwAttributes;
        'hw-stepper-component': ReactHTMLElement & HwAttributes;
        'hw-html-component': ReactHTMLElement & HwAttributes;
        'hw-url-component': ReactHTMLElement & HwAttributes;
        'hw-form-component': ReactHTMLElement & HwAttributes;
        'hw-tree-grid-component': ReactHTMLElement & HwAttributes;
        'hw-calendar-component': ReactHTMLElement & HwAttributes;
        'hw-dynamic-component': ReactHTMLElement & HwAttributes;
        'hw-map-component': ReactHTMLElement & HwAttributes;
        'hw-sankey-component': ReactHTMLElement & HwAttributes;
        'hw-mermaid-component': ReactHTMLElement & HwAttributes;
      }
    }
  }
}