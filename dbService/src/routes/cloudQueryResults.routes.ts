import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', (req: Request, res: Response) => {
    try {
        const { userId, connectionId, data } = req.body;
        
        // Print the received data
        console.log('Received CloudQuery results:');
        console.log('User ID:', userId);
        console.log('Connection ID:', connectionId);
        console.log('Data:', JSON.stringify(data, null, 2));
        
        // For now, just return success
        res.status(200).json({ message: 'Results received successfully' });
    } catch (error) {
        console.error('Error processing CloudQuery results:', error);
        res.status(500).json({ error: 'Failed to process results' });
    }
});

export default router; 