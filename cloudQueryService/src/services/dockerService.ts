import Docker from 'dockerode';
import { config } from '../config';
import { logger } from '../utils/logger';

export class DockerService {
  private docker: Docker;
  private runningContainers: Set<string> = new Set();

  constructor() {
    this.docker = new Docker();
  }

  async runContainer(env: Record<string, string>): Promise<string> {
    try {
      const container = await this.docker.createContainer({
        Image: config.dockerImage,
        Env: Object.entries(env).map(([key, value]) => `${key}=${value}`),
        HostConfig: {
          NetworkMode: config.queryNetwork,
          AutoRemove: true
        }
      });

      const containerId = container.id;
      this.runningContainers.add(containerId);
      
      // Attach to container to capture output
      const stream = await container.attach({ stream: true, stdout: true, stderr: true });
      
      stream.on('data', (data: Buffer) => {
        logger.info(`Container ${containerId} output: ${data.toString()}`);
      });

      await container.start();
      
      // Wait for container to exit and remove it
      const exitCode = await container.wait();
      this.runningContainers.delete(containerId);
      
      if (exitCode.StatusCode !== 0) {
        throw new Error(`Container exited with status code ${exitCode.StatusCode}`);
      }

      return containerId;
    } catch (error) {
      logger.error('Error running container:', error);
      throw error;
    }
  }

  getRunningContainersCount(): number {
    return this.runningContainers.size;
  }
} 