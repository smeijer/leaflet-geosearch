import preact, { Component } from 'preact';
import microlight from 'microlight';
window.microlight = microlight;

class Code extends Component {
  componentDidMount() {
    microlight.reset('code');
  }

  componentDidUpdate(prevProps) {
    const { children } = this.props;
    this.container.innerHTML = children.join('\n\n');
    microlight.reset('code');
  }

  defineContainer = (ref) => {
    this.container = ref;
  };

  render() {
    const { children } = this.props;

    return (
      <div ref={this.defineContainer} className="code">
        {children}
      </div>
    );
  }
}

export default Code;
