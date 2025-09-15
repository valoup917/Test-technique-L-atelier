import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

// Function to load YAML files
const loadYamlFile = (filePath: string): any => {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents);
  } catch (error) {
    console.error(`Error loading YAML file ${filePath}:`, error);
    return {};
  }
};

// Load all schema definitions
const loadDefinitions = (): any => {
  const definitionsDir = path.join(__dirname, 'swagger', 'definitions');
  const definitions: any = {};
  
  try {
    if (fs.existsSync(definitionsDir)) {
      fs.readdirSync(definitionsDir).forEach(file => {
        if (file.endsWith('.yaml')) {
          const def = loadYamlFile(path.join(definitionsDir, file));
          Object.assign(definitions, def);
        }
      });
    }
  } catch (error) {
    console.error('Error loading definitions:', error);
  }
  
  return definitions;
};

// Load all response definitions
const loadResponses = (): any => {
  const responsesDir = path.join(__dirname, 'swagger', 'responses');
  const responses: any = {};
  
  try {
    if (fs.existsSync(responsesDir)) {
      fs.readdirSync(responsesDir).forEach(file => {
        if (file.endsWith('.yaml')) {
          const resp = loadYamlFile(path.join(responsesDir, file));
          Object.assign(responses, resp);
        }
      });
    }
  } catch (error) {
    console.error('Error loading responses:', error);
  }
  
  return responses;
};

// Load all paths
const loadPaths = (): any => {
  const pathsDir = path.join(__dirname, 'swagger', 'paths');
  const paths: any = {};
  
  try {
    if (fs.existsSync(pathsDir)) {
      fs.readdirSync(pathsDir).forEach(file => {
        if (file.endsWith('.yaml')) {
          const pathKey = file === 'players.yaml' 
            ? '/players' 
            : file === 'players-statistics.yaml'
              ? '/players/statistics'
              : `/${file.replace('.yaml', '')}`;
          
          paths[pathKey] = loadYamlFile(path.join(pathsDir, file));
        }
      });
    }
  } catch (error) {
    console.error('Error loading paths:', error);
  }
  
  return paths;
};

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tennis Players API',
      version: '1.0.0',
      description: 'A REST API for managing tennis players data',
      license: {
        name: 'ISC',
        url: 'https://github.com/valoup917/Test-technique-L-atelier-#readme',
      },
      contact: {
        name: 'API Support',
        url: 'https://github.com/valoup917/Test-technique-L-atelier-/issues',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current environment',
      },
    ],
    components: {
      schemas: loadDefinitions(),
      responses: loadResponses(),
    },
    paths: loadPaths(),
  },
  apis: [], // We're using our yaml files instead
  
  // Ensure Swagger UI finds the spec when accessed from any domain or path
  swaggerOptions: {
    url: '/swagger.json',
  },
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
