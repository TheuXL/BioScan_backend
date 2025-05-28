const Fire = require('../entities/Fire');

/**
 * Use case for retrieving active fires data
 */
class GetActiveFiresUseCase {
  /**
   * Create a new GetActiveFiresUseCase instance
   * @param {Object} firesRepository - Repository for accessing fire data
   */
  constructor(firesRepository) {
    this.firesRepository = firesRepository;
  }

  /**
   * Execute the use case
   * @returns {Promise<Array<Fire>>} - Array of Fire entities
   */
  async execute() {
    try {
      // Get raw data from repository
      const rawFiresData = await this.firesRepository.fetchActiveFires();
      
      // Transform raw data into domain entities
      const fires = Fire.createFromArray(rawFiresData);
      
      return fires;
    } catch (error) {
      console.error('Error in GetActiveFiresUseCase:', error);
      throw error;
    }
  }
}

module.exports = GetActiveFiresUseCase; 