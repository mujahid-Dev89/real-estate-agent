export interface PersonalityAttributes {
    friendliness: number;
    professionalism: number;
    assertiveness: number;
    empathy: number;
  }
  
  export interface TrainingScenario {
    scenario: string;
    expectedResponse: string;
  }
  
  export interface ResponseTemplate {
    id: string;
    name: string;
    content: string;
    category: string;
  }
  