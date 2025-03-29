import Docker from 'dockerode';
import { logger } from '../utils/logger';

interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  env: Record<string, string>;
}

export class DockerService {
  private docker: Docker;
  private runningContainers: Map<string, ContainerInfo> = new Map();

  constructor() {
    this.docker = new Docker();
  }

  async pullImage(image: string): Promise<void> {
    return new Promise((resolve, reject) => {
        logger.info(`Pulling image: ${image} from Docker Hub...`);

        this.docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) {
                logger.error(`Failed to pull image ${image}:`, err);
                return reject(err);
            }

            this.docker.modem.followProgress(
                stream,
                () => {
                    logger.info(`Successfully pulled image: ${image}`);
                    resolve();
                },
                (event: { status: string }) => logger.info(`Pulling progress: ${event.status}`)
            );
        });
    });
}

  async runContainer(image: string, env: Record<string, string>): Promise<string> {
    try {
      // Ensure the image is available locally
      await this.pullImage(image);
      
      logger.info(`Creating container with image: ${image} and environment:`, env);
      
      const container = await this.docker.createContainer({
        Image: image,
        Env: Object.entries(env).map(([key, value]) => `${key}=${value}`),
        HostConfig: {
          AutoRemove: true,
          NetworkMode: 'query-network'
        }
      });

      const containerId = container.id;
      const containerInfo: ContainerInfo = {
        id: containerId,
        name: containerId.substring(0, 12),
        status: 'starting',
        env: env
      };
      
      this.runningContainers.set(containerId, containerInfo);

      // Attach to container to capture output
      const stream = await container.attach({ 
        stream: true, 
        stdout: true, 
        stderr: true
      });
      
      let output = '';
      stream.on('data', (data: Buffer) => {
        const chunk = data.toString();
        output += chunk;
        logger.info(`Container ${containerId} output: ${chunk}`);
      });

      await container.start();
      containerInfo.status = 'running';

      // Wait for container to exit and remove it from the running list
      const exitCode = await container.wait();
      this.runningContainers.delete(containerId);

      if (exitCode.StatusCode !== 0) {
        logger.error(`Container ${containerId} failed with output:`, output);
        throw new Error(`Container exited with status code ${exitCode.StatusCode}\nOutput: ${output}`);
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

  getRunningContainers(): ContainerInfo[] {
    return Array.from(this.runningContainers.values());
  }
}
