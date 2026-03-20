const HEADER_BLOCK = {
  block_type: 'header',
  title: 'Encabezado',
  content: '',
  background_type: null,
  background_value: null,
  text_color: null,
  config: {}
};

const parseConfig = (config) => {
  if (!config) {
    return {};
  }

  if (typeof config === 'object') {
    return config;
  }

  try {
    return JSON.parse(config);
  } catch (error) {
    return {};
  }
};

const assembleMenuPayload = (blocks = []) => {
  const normalizedBlocks = Array.isArray(blocks)
    ? blocks
        .filter((block) => block && block.block_type)
        .map((block) => ({
          ...block,
          config: parseConfig(block.config)
        }))
    : [];

  const headerBlock =
    normalizedBlocks.find((block) => block.block_type === 'header') || { ...HEADER_BLOCK };

  const orderedBlocks = [
    headerBlock,
    ...normalizedBlocks.filter((block) => block !== headerBlock && block.block_type !== 'header')
  ];

  return orderedBlocks.map((block, index) => ({
    id: block.id || null,
    block_type: block.block_type,
    title: block.title || null,
    content: block.content || null,
    background_type: block.background_type || null,
    background_value: block.background_value || null,
    text_color: block.text_color || null,
    sort_order: index,
    config: block.config || {}
  }));
};

module.exports = {
  assembleMenuPayload
};
